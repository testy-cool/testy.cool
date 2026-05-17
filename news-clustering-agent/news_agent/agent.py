"""The root ADK agent: collects, clusters, classifies, and reports on news."""

from __future__ import annotations

from google.adk.agents import LlmAgent

from . import config
from .tools import cluster_news, collect_news, save_report

_CATEGORY_LIST = "\n".join(f"- {category}" for category in config.CATEGORIES)

INSTRUCTION = f"""You are a news clustering and classification agent.

Work through these steps in order:

1. Call `collect_news` to gather news items from the RSS feeds and any
   user-provided articles.
2. Call `cluster_news` to group related items into story clusters.
3. For every cluster returned, decide:
   - `category`: exactly one name from this fixed list:
{_CATEGORY_LIST}
   - `headline`: a short headline capturing the cluster's story.
   - `summary`: a 1-2 sentence summary of the story.
4. Call `save_report` exactly once. Pass `classifications_json` as a JSON array
   string with one object per cluster, each having the keys cluster_id,
   category, headline, and summary.
5. Reply to the user with a concise digest: the article count, the cluster
   count, and the top stories grouped by category.

Rules:
- Use the category names exactly as written above. Use "Other" if nothing fits.
- A cluster of size 1 is still a valid cluster - classify it normally.
- Never invent articles; only classify what the tools return.
- Do the steps in order and never skip `save_report`.
"""

root_agent = LlmAgent(
    name="news_clustering_agent",
    model=config.DEFAULT_MODEL,
    description=(
        "Collects news from RSS feeds and user-provided articles, clusters "
        "related stories, and classifies each cluster by topic."
    ),
    instruction=INSTRUCTION,
    tools=[collect_news, cluster_news, save_report],
)
