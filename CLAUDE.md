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

## Tools

The `/tools` page is a curated directory that lists both standalone tools and tutorial-embedded tools.

### Two types of tools, one index

```
/tools                           <- Index listing ALL tools
/tools/[slug]                    <- Complex standalone tools (dedicated pages)
/blog/[category]/[slug]          <- Simple tools embedded in tutorials
```

**Rule of thumb:**
- **Tool is the point** -> `/tools/[slug]` (standalone page)
- **Learning is the point, tool helps** -> blog post with `tool` tag

Users browse `/tools`, click what they need. They don't care where it lives.

### File structure

```
apps/web/app/(home)/tools/
├── page.tsx                     # Index page listing all tools
├── layout.tsx                   # Shared tools layout
└── [tool-name]/                 # Only for standalone tools
    └── page.tsx
```

### Adding a standalone tool

1. Create `apps/web/app/(home)/tools/[tool-name]/page.tsx`
2. Add entry to the `tools` array in `apps/web/app/(home)/tools/page.tsx`:
   ```tsx
   {
     slug: "tool-name",
     title: "Tool Name",
     description: "Short description of what it does.",
     screenshot: "/images/tools/tool-name.png",
     tags: ["CSS", "Responsive"],
   }
   ```
3. Add screenshot to `apps/web/public/images/tools/tool-name.png` (aspect ratio 16:9)

### Adding a tutorial-embedded tool

1. Create blog post in `apps/web/content/blog/[category]/tool-name.mdx`
2. Add `tool` to the tags array in frontmatter
3. Create interactive components in `apps/web/components/tools/`
4. Register components in `apps/web/mdx-components.tsx`
5. Add entry to the `tools` array with `blogPath`:
   ```tsx
   {
     slug: "tool-name",
     title: "Tool Name",
     description: "Short description.",
     screenshot: "/images/tools/tool-name.png",
     tags: ["CSS", "Tutorial"],
     blogPath: "/blog/category/tool-name",
   }
   ```

## Tutorial Writing Guidelines

When creating tutorial content (especially for tools):

### Build from zero
- Don't assume prior knowledge
- Explain WHY things work, not just HOW
- Start with the simplest concept and layer complexity

### Use progressive disclosure
1. Show the tool first (immediate value)
2. Brief explanation of what it does
3. Deep dive into the mechanics
4. Edge cases and advanced usage

### Include interactive elements
- Mini-calculators throughout to reinforce concepts
- Live previews showing cause and effect
- Comparison widgets (e.g., breakpoints vs fluid)

### Personal, conversational tone
- First person: "I used to do X until I learned Y"
- Casual but grammatically correct
- Address the reader directly
- Acknowledge pain points ("ever notice how...")

### Example structure for a tool tutorial

```mdx
---
title: Tool Name and Tutorial
description: One-line hook about the problem it solves.
tags: [category, topic, tool]
---

Brief intro (2-3 sentences on why this matters).

## The Tool

<ToolComponent />

---

## Why This Matters

Personal anecdote or common pain point.

<ComparisonWidget />

## Building Up From Zero

### Step 1: Foundation concept

Explanation with interactive mini-tool.

<MiniTool1 />

### Step 2: Next concept

Build on step 1...

<MiniTool2 />

## Common Pitfalls

Real problems people encounter.

## Quick Reference

Cheat sheet for practical use.
```

## Branding

- Site: testy.cool
- Tagline: "Mostly LLMs, mostly."
- Description: "Notes on LLMs, agents, automation and development. Tools too. Primarily written for myself."
- Social: X (@testy_cool), GitHub (testy-cool), Bluesky (testycool.bsky.social)
