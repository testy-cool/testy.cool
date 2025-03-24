---
title: "Spider.Cloud Web Scraper Review"
description: "Tried Spider.Cloud. Had really high hopes. Am disappointed."
pubDate: "2024-12-13"
author: "testycool"
image: "/images/spidercloud-web-scraper-review/Spider.Cloud Homepage Screenshot.png"
tags: ["web-scraping", "product-review", "development-tools"]
---

![Spider.Cloud Homepage Screenshot](/images/spidercloud-web-scraper-review/Spider.Cloud Homepage Screenshot.png)

Spider.Cloud is a web scraping tool that allows you to scrape websites and extract data. 

It was recommended during a video by AI Jason, whose videos I really like.

I tried using Spider.Cloud, and while it's interesting, for me it's not a great fit.

### It appealed to me thanks to

- being cheap
- having proxies, and LLM support integrated. So I figured it's well-thought-out out of the box, so I don't need to waste time developing my own.
- ability to store data in their cloud, so I don't need to worry about caching and storage.

### Why I gave up on it

#### Docs feel incomplete and unclear

I don't know the search engine used by the `/search` endpoint, so I don't know if it's a Google search or something else.

I tried their example on [Filtering Links](https://spider.cloud/docs/api#filter-links):

```python
import requests, os

headers = {
    "Authorization": f'Bearer {os.getenv("SPIDER_API_KEY")}',
    "Content-Type": "application/jsonl",
}

json_data = {
    "limit": 25,
    "return_format": "markdown",
    "custom_prompt": "Include only links that may help in extracting value when shopping at Macy's.",
    "model": "gpt-4o",
    "url": "https://macys.com",
}

response = requests.post(
    "https://api.spider.cloud/pipeline/filter-links", headers=headers, json=json_data
)

print(response.json())
```

And got this result:

```json
{'content': [{'error': 'No URL provided for analysis.'}], 'costs': None, 'error': '', 'status': 200}
```

#### Strangely Slow

I tried scraping 5 pages after performing a search, and it took 5+ minutes. Some pages would take 2m to scrape.

They mention that they respect `robots.txt`, which is good, but I don't see why it would take you 2m to scrape a page you just visited for the first time.

That's about it. Decided to try something else. 