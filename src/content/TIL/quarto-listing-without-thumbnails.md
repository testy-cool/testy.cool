---
title: "How to Remove Empty Image Placeholders from Quarto Listings"
description: "Using image-placeholder: \"\" and fields configuration in _quarto.yml"
published: 2025-01-01
---

## The Problem

By default, Quarto's listing pages show thumbnails for each post. Even if you don't have images, it still reserves space for them, creating unnecessary whitespace.

## The Solution

In your listing page (e.g., `index.qmd`), configure the listing like this:

```yaml
listing:
  type: default
  fields: [date, title, author, description]
  image-placeholder: ""
```

This:
* Uses `default` layout instead of table/grid
* Only shows the fields you want
* Sets empty image placeholder to remove the space

## Why It Works

The key is `image-placeholder: ""`. Without this, Quarto reserves space for thumbnails even when posts don't have images. Setting it to an empty string removes this space entirely.

The `fields` list explicitly states what you want to show, giving you clean, text-only listings. 