#!/usr/bin/env python3
"""Run the news clustering agent as a one-shot pipeline.

Examples:
    python run.py
    python run.py --feeds https://hnrss.org/frontpage https://techcrunch.com/feed/
    python run.py --articles sample_articles.json --threshold 0.4
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys

from dotenv import load_dotenv

load_dotenv()

from google.adk.runners import InMemoryRunner  # noqa: E402
from google.genai import types  # noqa: E402

from news_agent import config  # noqa: E402
from news_agent.agent import root_agent  # noqa: E402

APP_NAME = "news_agent"
USER_ID = "local"


def load_articles(path: str) -> list[dict]:
    """Load user-provided articles from a JSON file.

    Accepts either a JSON list or an object of the form {"articles": [...]}.
    """
    with open(path, encoding="utf-8") as handle:
        data = json.load(handle)
    if isinstance(data, dict):
        data = data.get("articles", [])
    if not isinstance(data, list):
        raise ValueError('Articles file must be a JSON list or {"articles": [...]}.')
    return data


async def run_pipeline(args: argparse.Namespace) -> None:
    user_articles = load_articles(args.articles) if args.articles else []
    feed_urls = args.feeds if args.feeds else config.DEFAULT_FEEDS

    initial_state = {
        "feed_urls": feed_urls,
        "user_articles": user_articles,
        "max_per_feed": args.max_per_feed,
        "output_dir": args.output_dir,
    }
    if args.threshold > 0:
        initial_state["threshold"] = args.threshold

    runner = InMemoryRunner(agent=root_agent, app_name=APP_NAME)
    session = await runner.session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, state=initial_state
    )

    prompt = (
        "Collect the news, cluster the related stories, classify each cluster, "
        "and save the report. Then give me the digest."
    )
    message = types.Content(role="user", parts=[types.Part(text=prompt)])

    final_text = ""
    async for event in runner.run_async(
        user_id=USER_ID, session_id=session.id, new_message=message
    ):
        if not event.content or not event.content.parts:
            continue
        for part in event.content.parts:
            if part.function_call:
                print(f"  -> {part.function_call.name}()", file=sys.stderr)
            if part.text:
                final_text = part.text

    print("\n" + final_text.strip())


def main() -> None:
    parser = argparse.ArgumentParser(description="News clustering + classifying agent")
    parser.add_argument("--feeds", nargs="*", help="RSS feed URLs (overrides the defaults)")
    parser.add_argument("--articles", help="Path to a JSON file of user-provided articles")
    parser.add_argument("--max-per-feed", type=int, default=25, help="Max items per feed")
    parser.add_argument("--output-dir", default="output", help="Where to write the report")
    parser.add_argument(
        "--threshold",
        type=float,
        default=0.0,
        help="Clustering distance threshold (0 uses the configured default)",
    )
    args = parser.parse_args()

    if not (os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")):
        print(
            "Warning: GOOGLE_API_KEY is not set. Copy .env.example to .env and "
            "add your key, or export it before running.",
            file=sys.stderr,
        )

    asyncio.run(run_pipeline(args))


if __name__ == "__main__":
    main()
