"""News ingestion: RSS feeds and user-provided articles."""

from __future__ import annotations

import hashlib
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone

import feedparser

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")


@dataclass
class NewsItem:
    id: str
    title: str
    summary: str
    url: str
    source: str
    published: str

    def to_dict(self) -> dict:
        return asdict(self)


def _make_id(url: str, title: str) -> str:
    return hashlib.sha1(f"{url}|{title}".encode("utf-8")).hexdigest()[:12]


def _clean(text: str | None) -> str:
    """Strip HTML tags and collapse whitespace."""
    return _WS_RE.sub(" ", _TAG_RE.sub(" ", text or "")).strip()


def fetch_feed(url: str, max_items: int = 25) -> list[NewsItem]:
    """Parse a single RSS/Atom feed into NewsItem objects."""
    parsed = feedparser.parse(url)
    source = _clean(parsed.feed.get("title")) if parsed.feed else ""
    source = source or url

    items: list[NewsItem] = []
    for entry in parsed.entries[:max_items]:
        title = _clean(entry.get("title"))
        if not title:
            continue
        link = entry.get("link", "")
        summary = _clean(entry.get("summary") or entry.get("description"))[:600]

        published = ""
        if entry.get("published_parsed"):
            published = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc).isoformat()
        elif entry.get("published"):
            published = str(entry.get("published"))

        items.append(
            NewsItem(
                id=_make_id(link, title),
                title=title,
                summary=summary,
                url=link,
                source=source,
                published=published,
            )
        )
    return items


def fetch_feeds(urls: list[str], max_per_feed: int = 25) -> list[NewsItem]:
    """Fetch many feeds, skipping any that fail, and dedupe by item id."""
    seen: set[str] = set()
    out: list[NewsItem] = []
    for url in urls:
        try:
            for item in fetch_feed(url, max_per_feed):
                if item.id in seen:
                    continue
                seen.add(item.id)
                out.append(item)
        except Exception as exc:  # noqa: BLE001 - one bad feed must not abort the run
            print(f"[news_agent] failed to fetch {url}: {exc}")
    return out


def normalize_user_articles(articles: list[dict]) -> list[NewsItem]:
    """Convert user-supplied article dicts into NewsItem objects.

    Each dict may contain: title, url, text (or summary), source, published.
    """
    out: list[NewsItem] = []
    for article in articles:
        title = _clean(article.get("title"))
        text = _clean(article.get("text") or article.get("summary"))
        if not title and not text:
            continue
        if not title:
            title = text[:80]
        url = article.get("url", "")
        out.append(
            NewsItem(
                id=_make_id(url, title),
                title=title,
                summary=text[:600],
                url=url,
                source=article.get("source") or "user-provided",
                published=article.get("published", ""),
            )
        )
    return out
