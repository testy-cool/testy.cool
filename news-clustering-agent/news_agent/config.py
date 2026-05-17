"""Configuration for the news clustering agent.

Every value can be overridden with an environment variable so the agent can be
tuned without touching code.
"""

from __future__ import annotations

import os

# Model used by the LLM agent for classification and report writing.
DEFAULT_MODEL = os.getenv("NEWS_AGENT_MODEL", "gemini-2.5-flash")

# Embedding model used for semantic clustering.
EMBEDDING_MODEL = os.getenv("NEWS_AGENT_EMBEDDING_MODEL", "text-embedding-004")

# Clustering backend: "gemini" (semantic embeddings) or "tfidf" (offline, no API).
CLUSTERING_METHOD = os.getenv("NEWS_AGENT_CLUSTERING", "gemini")

# Cosine-distance merge threshold for agglomerative clustering.
# Lower -> more, tighter clusters. Higher -> fewer, looser clusters.
DISTANCE_THRESHOLD = float(os.getenv("NEWS_AGENT_THRESHOLD", "0.35"))

# RSS feeds used when no feeds are supplied explicitly.
DEFAULT_FEEDS = [
    "https://hnrss.org/frontpage",
    "https://feeds.arstechnica.com/arstechnica/index",
    "https://www.theverge.com/rss/index.xml",
    "https://techcrunch.com/feed/",
]

# Fixed taxonomy the agent classifies clusters into.
CATEGORIES = [
    "AI & Machine Learning",
    "Software & Web Development",
    "Hardware & Devices",
    "Business & Startups",
    "Security & Privacy",
    "Science & Space",
    "Policy & Regulation",
    "Other",
]
