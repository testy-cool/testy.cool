"""ADK tools the news agent calls to collect, cluster, and report on news."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone

from google.adk.tools import ToolContext

from . import config
from .clustering import cluster_texts
from .feeds import fetch_feeds, normalize_user_articles


def collect_news(tool_context: ToolContext) -> dict:
    """Collect news items from the configured RSS feeds and user-provided articles.

    Reads the feed URLs and any user-provided articles from session state,
    fetches the RSS feeds, normalizes everything into one deduplicated list, and
    stores it in session state for the clustering step.

    Returns:
        A dict with the number of items collected, the list of sources, and a
        preview of the collected titles.
    """
    feed_urls = tool_context.state.get("feed_urls") or config.DEFAULT_FEEDS
    user_articles = tool_context.state.get("user_articles") or []
    max_per_feed = int(tool_context.state.get("max_per_feed") or 25)

    items = fetch_feeds(list(feed_urls), max_per_feed)
    items.extend(normalize_user_articles(list(user_articles)))

    seen: set[str] = set()
    deduped = []
    for item in items:
        if item.id in seen:
            continue
        seen.add(item.id)
        deduped.append(item)

    tool_context.state["news_items"] = [item.to_dict() for item in deduped]
    return {
        "status": "ok",
        "item_count": len(deduped),
        "sources": sorted({item.source for item in deduped}),
        "sample_titles": [item.title for item in deduped[:15]],
    }


def cluster_news(tool_context: ToolContext, distance_threshold: float = 0.0) -> dict:
    """Group the collected news items into clusters of related stories.

    Must be called after collect_news. Uses semantic embeddings (or TF-IDF) plus
    agglomerative clustering, then stores the clusters in session state.

    Args:
        distance_threshold: Cosine-distance merge threshold, roughly 0.2-0.6.
            Lower values produce more, tighter clusters. Pass 0 to use the
            configured default.

    Returns:
        A dict describing every cluster: its id, size, and the titles it holds.
    """
    items = tool_context.state.get("news_items") or []
    if not items:
        return {"status": "error", "message": "No news items found. Call collect_news first."}

    threshold = (
        distance_threshold
        or float(tool_context.state.get("threshold") or 0)
        or config.DISTANCE_THRESHOLD
    )
    texts = [f"{item['title']}. {item['summary']}".strip() for item in items]

    try:
        labels = cluster_texts(texts, threshold, config.CLUSTERING_METHOD)
    except Exception as exc:  # noqa: BLE001 - surface a clean error to the agent
        return {"status": "error", "message": f"Clustering failed: {exc}"}

    grouped: dict[int, list] = {}
    for item, label in zip(items, labels):
        grouped.setdefault(int(label), []).append(item)

    # Largest clusters first, with fresh sequential ids.
    ordered = sorted(grouped.values(), key=len, reverse=True)
    stored = []
    summary = []
    for cluster_id, members in enumerate(ordered):
        stored.append({"cluster_id": cluster_id, "articles": members})
        summary.append(
            {
                "cluster_id": cluster_id,
                "size": len(members),
                "titles": [member["title"] for member in members],
            }
        )

    tool_context.state["clusters"] = stored
    return {"status": "ok", "cluster_count": len(stored), "clusters": summary}


def save_report(
    tool_context: ToolContext,
    classifications_json: str,
    output_dir: str = "output",
) -> dict:
    """Save the final clustered and classified news report as JSON and Markdown.

    Must be called after cluster_news.

    Args:
        classifications_json: A JSON array (as a string) with one object per
            cluster. Each object must have:
              - cluster_id (int): the id returned by cluster_news
              - category (str): one of the allowed categories
              - headline (str): a short headline for the cluster's story
              - summary (str): a 1-2 sentence summary of the story
        output_dir: Directory the report files are written into.

    Returns:
        A dict with the paths of the written files and summary counts.
    """
    clusters = tool_context.state.get("clusters") or []
    if not clusters:
        return {"status": "error", "message": "No clusters found. Call cluster_news first."}

    try:
        classifications = json.loads(classifications_json)
    except json.JSONDecodeError as exc:
        return {"status": "error", "message": f"classifications_json is not valid JSON: {exc}"}
    if not isinstance(classifications, list):
        return {"status": "error", "message": "classifications_json must be a JSON array."}

    meta: dict[int, dict] = {}
    for entry in classifications:
        if isinstance(entry, dict) and entry.get("cluster_id") is not None:
            meta[int(entry["cluster_id"])] = entry

    enriched = []
    for cluster in clusters:
        cluster_id = cluster["cluster_id"]
        info = meta.get(cluster_id, {})
        enriched.append(
            {
                "cluster_id": cluster_id,
                "category": info.get("category", "Other"),
                "headline": info.get("headline") or cluster["articles"][0]["title"],
                "summary": info.get("summary", ""),
                "size": len(cluster["articles"]),
                "articles": cluster["articles"],
            }
        )

    report = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "item_count": sum(len(c["articles"]) for c in clusters),
        "cluster_count": len(enriched),
        "clusters": enriched,
    }

    out_dir = tool_context.state.get("output_dir") or output_dir
    os.makedirs(out_dir, exist_ok=True)
    json_path = os.path.join(out_dir, "news_report.json")
    md_path = os.path.join(out_dir, "news_report.md")

    with open(json_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, indent=2, ensure_ascii=False)
    with open(md_path, "w", encoding="utf-8") as handle:
        handle.write(_render_markdown(report))

    return {
        "status": "ok",
        "json_path": json_path,
        "markdown_path": md_path,
        "cluster_count": report["cluster_count"],
        "item_count": report["item_count"],
    }


def _render_markdown(report: dict) -> str:
    lines = [
        "# News Digest",
        "",
        f"_Generated {report['generated_at']}_  ",
        f"_{report['item_count']} articles grouped into {report['cluster_count']} clusters_",
        "",
    ]

    by_category: dict[str, list] = {}
    for cluster in report["clusters"]:
        by_category.setdefault(cluster["category"], []).append(cluster)

    for category in sorted(by_category):
        lines += [f"## {category}", ""]
        for cluster in sorted(by_category[category], key=lambda c: c["size"], reverse=True):
            lines += [f"### {cluster['headline']}", ""]
            if cluster["summary"]:
                lines += [cluster["summary"], ""]
            lines += [f"_{cluster['size']} article(s)_", ""]
            for article in cluster["articles"]:
                source = article.get("source", "")
                if article.get("url"):
                    lines.append(f"- [{article['title']}]({article['url']}) - {source}")
                else:
                    lines.append(f"- {article['title']} - {source}")
            lines.append("")

    return "\n".join(lines)
