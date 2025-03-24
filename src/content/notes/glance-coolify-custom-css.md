---
title: "Failed: Custom CSS in Glance Dashboard on Coolify"
description: "Documenting a failed attempt to implement custom CSS in Glance dashboard when deployed through Coolify"
pubDate: "2025-01-01"
author: "testycool"
image: "/images/glance-coolify-custom-css/glanceapp.png"
tags: ["glance", "coolify", "css", "deployment", "self-hosting"]
---

![First View of Glance](/images/glance-coolify-custom-css/glanceapp.png)

I wanted to use a custom CSS theme for my Glance dashboard. The default font is JetBrains Mono, which is great for code, but not so great for reading. I wanted to use a custom CSS theme that is more readable.

:::note
Glance is a modern, self-hosted dashboard application that aggregates content from various sources like RSS feeds, Reddit, Hacker News, YouTube, and GitHub into a single customizable interface. It features a widget-based system that lets you monitor everything from weather and stocks to server metrics and site status, all through a clean and minimal UI.
:::

## The Setup

I recently tried setting up [Glance](https://github.com/glance-app/glance) - a sleek dashboard app - using Coolify as my deployment platform. The basic setup was straightforward: create a new service in Coolify, point it to the Glance Docker image, and configure the basics.

## The Custom CSS Challenge

Glance supports custom CSS through a configuration option in `glance.yml`:

```yaml
theme:
  custom-css-file: custom.css
```

And Coolify provides volume mounting to persist files. In theory, this should be simple - mount a volume, add your CSS file, point Glance to it. In practice? Not so much.

## What I Tried

1. First attempt: Put the CSS file directly in the service directory
   ```yaml
   theme:
     custom-css-file: custom.css
   ```

2. Then tried the full path approach:
   ```yaml
   theme:
     custom-css-file: /user/assets/custom.css
   ```

3. Moved server config around:
   ```yaml
   server:
     host: 0.0.0.0
     port: 8080
     assets-path: /user/assets
   ```

4. Even tried creating a `/static` directory and putting the CSS there.

Every attempt resulted in the same thing: a 404 error when trying to access the CSS file.

## The Volume Setup

In Coolify, the volume was configured as:
- Source: `aks0wk0w84ocgc0os0gs4sgw_glance-assets`
- Destination: `/user/assets`

The file was definitely there - I could see it when checking the container:

```bash
$ docker exec -it glance-aks0wk0w84ocgc0os0gs4sgw ls -la /user/assets
total 12
drwxr-xr-x    2 root     root          4096 Jan  1 20:24 .
drwxr-xr-x    3 root     root          4096 Jan  1 20:26 ..
-rw-r--r--    1 root     root            29 Jan  1 20:24 custom.css
```

## Current Status

After trying various paths, permissions, and configurations, I still couldn't get Glance to serve the CSS file. Each attempt resulted in a 404 error when trying to access the CSS file through the web interface.

For now, I've put this project on hold. If anyone has experience with getting custom CSS working in Glance when deployed through Coolify, I'd love to hear about it! 