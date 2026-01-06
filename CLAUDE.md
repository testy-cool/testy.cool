# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

This is a pnpm monorepo using Turborepo with three main packages:

- **apps/web**: Next.js 15 blog site using Fumadocs for MDX content
- **packages/fumadocs-blog**: Blog components (post cards, pagination, series support)
- **packages/shadverse**: shadcn/ui component library

### Content System

Blog content uses Fumadocs MDX:
- Posts go in `apps/web/content/blog/` as `.mdx` files
- Schema defined in `apps/web/source.config.ts` (author, date, tags, image, draft, series)
- Content loaded via `apps/web/lib/source.ts` using `fumadocs-core/source` loader
- Supports math (KaTeX), code highlighting (Shiki with twoslash), and mermaid diagrams

### Key Dependencies

- Next.js 15 with Turbopack for dev
- Fumadocs (core, mdx, ui) for documentation/blog framework
- Tailwind CSS v4
- Framer Motion for animations
