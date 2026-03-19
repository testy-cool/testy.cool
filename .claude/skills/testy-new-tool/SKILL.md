---
name: testy-new-tool
description: Scaffold a new tool for testy.cool - standalone page or tutorial-embedded - following the project's tool creation checklist.
disable-model-invocation: true
---

# New Tool Scaffold

Create a new tool for testy.cool. Ask the user which type, then follow the checklist.

## Step 1: Gather info

Ask the user (use AskUserQuestion):
- **Tool name** (slug form, e.g. `color-picker`)
- **Title** (display name)
- **Short description** (one sentence)
- **Tags** (e.g. CSS, LLM, API)
- **Type**: Standalone (`/tools/[slug]`) or Tutorial-embedded (blog post with interactive component)
- **Category** (if tutorial-embedded): tutorial, troubleshooting, tools-tech, tech, conceptual, solution, lab-notes

## Step 2: Standalone tool

If standalone:

1. Create `apps/web/app/(home)/tools/[slug]/page.tsx` with:
   - `"use client"` directive
   - Page content and interactive component
   - SSR-safe patterns: use `useEffect` for `localStorage`, not `useState(loadFromStorage)`

2. Add entry to `tools` array in `apps/web/app/(home)/tools/page.tsx`:
   ```tsx
   {
     slug: "[slug]",
     title: "[Title]",
     description: "[description]",
     tags: ["Tag1", "Tag2"],
   },
   ```

3. If the tool needs API keys or a backend:
   - Create CF Function in `functions/api/[slug]/index.ts`
   - Export `onRequestGet` / `onRequestPost` typed as `PagesFunction<Env>`
   - Access secrets via `context.env.VAR_NAME` (set in CF dashboard)

4. Tool lib files go in `apps/web/lib/tools/[slug]/`
5. Tool components go in `apps/web/components/tools/[slug]/` (or single file `apps/web/components/tools/ToolName.tsx`)

## Step 3: Tutorial-embedded tool

If tutorial-embedded:

1. Create blog post at `apps/web/content/blog/[category]/[slug].mdx` with frontmatter:
   ```mdx
   ---
   title: [Title]
   description: [description]
   date: [today YYYY-MM-DD]
   author: testy.cool
   id: [slug]
   status: draft
   tags: [tag1, tag2, tool]
   ---
   ```
   Include `tool` in the tags array.

2. Create interactive components in `apps/web/components/tools/[ComponentName].tsx`
   - Use `"use client"` directive
   - SSR-safe: `useEffect` for browser APIs, not top-level access

3. Register components in `apps/web/mdx-components.tsx`

4. Add entry to `toolTutorials` array in `apps/web/app/(home)/tools/page.tsx`:
   ```tsx
   {
     slug: "[slug]",
     title: "[Title]",
     description: "[description]",
     tags: ["Tag1", "Tutorial"],
     blogPath: "/blog/[category]/[slug]",
   },
   ```

5. Follow tutorial writing guidelines:
   - Show the tool first (immediate value)
   - Explain WHY, not just HOW
   - Progressive disclosure: tool > explanation > deep dive > edge cases
   - Personal, conversational tone
   - Include interactive elements throughout

## Step 4: Verify

- Run `pnpm web:build` to confirm it compiles
- Run `pnpm web:dev` and check the page renders
- Verify the tool appears on `/tools` index page

## Styling rules

- Use fumadocs CSS tokens: `fd-card`, `fd-border`, `fd-background`, `fd-muted-foreground`, `fd-primary`, `fd-muted`
- Do NOT use raw Tailwind colors (no `bg-gray-100`, use `bg-fd-muted` etc.)
- Custom CSS animations go in `apps/web/app/styles/globals.css`
