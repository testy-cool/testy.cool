# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

testy.cool - A fumadocs-based blog using the documentation aesthetic instead of typical blog templates.

## Commands

```bash
# Development
pnpm dev              # Run all apps in dev mode
pnpm web:dev          # Run only the web app (faster)

# Build & Check
pnpm build            # Build all packages
pnpm web:build        # Build only web app
pnpm lint             # Run linting
pnpm check-types      # Type checking
pnpm format           # Format with Prettier

# Serve static build
pnpm web:serve        # Serve the static output
```

## Architecture

pnpm monorepo using Turborepo:

- **apps/web**: Next.js 15 blog site using Fumadocs for MDX content
- **packages/fumadocs-blog**: Blog components (post cards, pagination, series support)
- **packages/shadverse**: shadcn/ui component library
- **packages/ui**: Shared UI components (social icons, grid background, OG image templates)

## Content

Blog posts go in `apps/web/content/blog/[category]/post-name.mdx`:

```mdx
---
title: Post Title
description: Short description
date: 2026-01-06
author: testy.cool
tags: [tag1, tag2]
image: /images/blog/optional-custom-image.png  # optional, falls back to auto-generated OG
---

Content here.
```

## Key Files

- `apps/web/app/layout.config.tsx` - Site title, description, nav config
- `apps/web/blog-configuration.tsx` - Blog constants, categories, series definitions
- `apps/web/lib/metadata.ts` - SEO metadata, OpenGraph config
- `apps/web/components/hero.tsx` - Homepage hero section
- `apps/web/app/(home)/layout.tsx` - Footer social links
- `packages/ui/src/components/social-icons.tsx` - Social icon components
- `packages/fumadocs-blog/src/components/post-card.tsx` - Blog post card display

## Deployment

Cloudflare Pages with static export:
- Build command: `pnpm build`
- Output directory: `apps/web/out`
- Node version: 20 (via `.nvmrc`)
- Config: `wrangler.toml`

## Branding

- Site: testy.cool
- Tagline: "Mostly LLMs, mostly."
- Description: "Notes on LLMs, agents, automation and development. Tools too. Primarily written for myself."
- Social: X (@testy_cool), GitHub (testy-cool), Bluesky (testycool.bsky.social)
