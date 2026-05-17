# News Clustering Agent

A news item clustering and classifying agent built with [Google ADK](https://google.github.io/adk-docs/) (Agent Development Kit, Python).

It pulls news from RSS feeds and/or a user-provided list, groups related stories into clusters using semantic embeddings, classifies each cluster by topic, and writes a report as both structured JSON and a readable Markdown digest.

## How it works

```
collect_news   ->  fetch RSS feeds + user articles, dedupe
cluster_news   ->  embed items, agglomerative clustering by cosine distance
(LLM agent)    ->  classify each cluster into a category, write headline + summary
save_report    ->  write output/news_report.json and output/news_report.md
```

Clustering is deterministic (embeddings + scikit-learn). Classification, headlines, summaries, and the final digest are produced by the Gemini-backed ADK agent.

## Setup

Requires Python 3.10+.

```bash
cd news-clustering-agent
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # then add your GOOGLE_API_KEY
```

Get a free API key at https://aistudio.google.com/apikey.

## Usage

### One-shot pipeline

```bash
python run.py                                    # default feeds
python run.py --feeds https://hnrss.org/frontpage https://techcrunch.com/feed/
python run.py --articles sample_articles.json    # add a user-provided list
python run.py --threshold 0.4 --max-per-feed 15  # tune clustering / volume
```

Output lands in `output/news_report.json` and `output/news_report.md`.

### Interactive (ADK CLI)

From inside this directory:

```bash
adk run news_agent      # chat with the agent in the terminal
adk web                 # open the ADK dev UI in a browser
```

Just say something like *"collect, cluster and classify the news"*. With the
CLI the agent uses the default feeds in `news_agent/config.py`.

## User-provided articles

Pass a JSON file via `--articles`. It can be a list, or `{"articles": [...]}`.
Each article: `title`, `url`, `text` (or `summary`), optional `source` and
`published`. See `sample_articles.json`.

## Configuration

Everything is overridable by environment variable (see `.env.example`):

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEWS_AGENT_MODEL` | `gemini-2.5-flash` | Agent LLM |
| `NEWS_AGENT_EMBEDDING_MODEL` | `text-embedding-004` | Embedding model |
| `NEWS_AGENT_CLUSTERING` | `gemini` | `gemini` or `tfidf` (offline, no API) |
| `NEWS_AGENT_THRESHOLD` | `0.35` | Cosine-distance merge threshold |

Default RSS feeds and the category taxonomy live in `news_agent/config.py`.

## Output

`news_report.json`:

```json
{
  "generated_at": "2026-05-17T12:00:00+00:00",
  "item_count": 80,
  "cluster_count": 41,
  "clusters": [
    {
      "cluster_id": 0,
      "category": "AI & Machine Learning",
      "headline": "...",
      "summary": "...",
      "size": 4,
      "articles": [{ "title": "...", "url": "...", "source": "...", "published": "..." }]
    }
  ]
}
```

`news_report.md` is the same data as a digest grouped by category.

## Project layout

```
news-clustering-agent/
├── run.py                  # one-shot CLI pipeline
├── requirements.txt
├── sample_articles.json
└── news_agent/
    ├── agent.py            # root_agent (ADK LlmAgent)
    ├── tools.py            # collect_news / cluster_news / save_report
    ├── feeds.py            # RSS + user-article ingestion
    ├── clustering.py       # embeddings + agglomerative clustering
    └── config.py           # feeds, categories, tunables
```
