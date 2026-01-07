# testy.cool Project Context

## Project Overview
**testy.cool** is a personal blog and tools platform built as a monorepo. It focuses on LLM automations, research, and web development insights.
- **Stack:** Next.js 15, React 19, Tailwind CSS v4, Fumadocs.
- **Architecture:** Monorepo managed by `pnpm` and `Turborepo`.
- **Deployment:** Static export to Cloudflare Pages.

## Persona & Content Strategy

**Goal:** Emulate the "Simon Willison" style—prolific, technical, tiling, and open-source focused.

### Tone of Voice
- **Direct & No-Fluff:** Skip the "In this article we will explore..." intros. Start with the problem or the hook.
- **First-Person & Authentic:** Use "I" to describe experiences ("I used to set breakpoints everywhere...").
- **Educational but Practical:** Explain the *why* and the *math* behind solutions, not just the code. "No magic, just math."
- **Interactive:** Use embedded React components to demonstrate concepts live (e.g., calculators, previews).
- **Troubleshooting:** For fix-it posts, use a strict "Context -> Problem -> Solution" structure.

### Decision Matrix: New Post vs. Update
- **Create New Post:**
  - New concept or tool.
  - "TIL" (Today I Learned) style specific troubleshooting.
  - Significant evolution of an old idea.
  - **Philosophy:** Lean towards new, short posts. It builds a knowledge graph.
- **Update Existing Post:**
  - Corrections of facts.
  - Small code snippet optimizations.
  - Adding a "2026 update" note to a historically significant post.

### Decision Matrix: Tools (Embedded vs. Standalone)
- **Embedded (Preferred):**
  - **Context:** `apps/web/content/blog/[category]/[slug].mdx`
  - **Use Case:** Demonstrates a concept, simple interactive elements, context-heavy tools.
  - **Philosophy:** The blog post *is* the documentation. The tool serves the narrative.
- **Standalone:**
  - **Context:** `apps/web/app/(home)/tools/[tool-name]/page.tsx`
  - **Use Case:** "Product" utility (e.g., complex converter, dashboard), requires full-screen real estate, complex state management.
  - **Requirement:** Consider writing a blog post *about* building it that links to the tool.

## Inspiration
- **Simon Willison:** [simonwillison.net](https://simonwillison.net) — Look for his "TIL" patterns, extensive linking, and notes-to-self style.


## Directory Structure & Architecture

### Workspace Layout
- **`apps/web`**: The core Next.js application. Contains all pages, blog content (`content/blog`), and site-specific components.
- **`packages/fumadocs-blog`**: Encapsulates blog-specific logic (PostCard, Pagination, Series handling).
- **`packages/shadverse`**: Custom UI component library (Shadcn/UI implementation).
- **`packages/ui`**: General shared UI components (Social icons, Grid backgrounds).
- **`packages/config-*`**: Shared ESLint and TypeScript configurations.

### Key File Locations
- **Blog Configuration:** `apps/web/blog-configuration.tsx` (Categories, series, site metadata).
- **Navigation/Layout:** `apps/web/app/layout.config.tsx`.
- **Blog Content:** `apps/web/content/blog/**/*.mdx`.
- **Global Styles:** `apps/web/app/styles/globals.css`.
- **Tailwind Config:** `apps/web/postcss.config.mjs` (using v4, so minimal config).

## Development Workflow

### Scripts (Run from Root)
- **Install:** `pnpm install`
- **Start Dev Server (All):** `pnpm dev`
- **Start Web App Only (Preferred):** `pnpm web:dev`
- **Build All:** `pnpm build`
- **Build Web Only:** `pnpm web:build`
- **Type Check:** `pnpm check-types`
- **Format:** `pnpm format`

### Creating Content
- **Blog Posts:** Create MDX files in `apps/web/content/blog/[category]/`.
  - **Required Frontmatter:** `title`, `description`, `date` (YYYY-MM-DD), `author`.
  - **Optional Frontmatter:** `image`, `tags`, `series`.
- **Tools:**
  - Registered in `apps/web/app/(home)/tools/page.tsx`.
  - Components live in `apps/web/components/tools/` or `apps/web/app/(home)/tools/[tool-name]/`.

## Conventions & Standards
- **Styling:** Tailwind CSS v4. Use utility classes.
- **Components:** Prefer components from `@repo/shadverse` or `@repo/ui` over raw HTML/Tailwind where possible.
- **Imports:** Use `@repo/*` aliases for cross-package imports.
- **Package Management:** Always use `pnpm`.
- **Repo Management:** Do not manually edit `pnpm-lock.yaml`. Use `pnpm install` to update.

## Configuration Details
- **Tailwind v4:** Note that configuration is largely handled in CSS files (`@theme`) rather than `tailwind.config.js`.
- **Fumadocs:** Used for MDX processing and documentation-style features.
