# Agent Notes Workflow

This repo uses the blog as a public notes archive, but the source of truth is the MDX content inside the repo.

## Source Of Truth

- Canonical source files live in `apps/web/content/blog/[category]/*.mdx`
- Public machine-readable endpoints live at `/knowledge.json` and `/llms.txt`
- Agents should update repo files first, then let the site build publish the result

## Frontmatter Contract

Use this frontmatter shape for new notes:

```mdx
---
title: Post Title
description: Short description
date: 2026-03-07
updated: 2026-03-08 # optional
author: testy.cool
id: claude-code-ssh-setup
status: published # draft | published | evergreen | archived
confidence: high # low | medium | high
resumeSignal: supporting # none | supporting | featured
tags: [claude-code, ssh, tutorial]
canonical: /blog/tutorial/claude-code-ssh-setup # optional
supersedes: [older-note-id] # optional
image: /images/blog/optional-custom-image.png
---
```

## Field Rules

- `id` is the stable identifier. It should survive title edits, category moves, and rewrites.
- `date` is the original publish date. Do not rewrite it during revisions.
- `updated` changes when the public content meaningfully changes.
- `status` tracks lifecycle, not category. A `lab-notes` post can still have `status: published`.
- `resumeSignal` is only for content that should represent the author publicly.
- `supersedes` should contain note ids, not URLs.
- `canonical` should be a URL or site-relative path, not a note id.

## Agent Workflows

## Commands

Use the repo shortcuts:

```bash
pnpm note:capture -- --title "What I learned" --description "Short summary"
pnpm note:revise -- --id claude-code-ssh-setup --append-file ./update.md
pnpm note:promote -- --id claude-code-ssh-setup --status evergreen
```

Common flags:

- `--category` to choose or move the note folder
- `--slug` to change the filename slug
- `--tags` with a comma-separated list
- `--body` or `--body-file` to replace the body
- `--append` or `--append-file` to add content to the end
- `--prepend` or `--prepend-file` to add content to the beginning
- `--touch-updated` to force `updated: YYYY-MM-DD`
- `--dry-run` to preview the operation without writing files

### Capture Note

Use this when something useful comes out of a coding session but is not ready for a polished article.

Rules:

1. Search existing notes by `id`, slug, URL, and obvious title variants before creating a new file.
2. If the content is incomplete, put it in `lab-notes` or keep it as `draft: true` with `status: draft`.
3. Prefer updating an existing note over creating a near-duplicate.
4. Keep the note short and factual if the result is still partial.
5. `capture` defaults to `lab-notes`, `status: draft`, and `draft: true` unless you override them.

### Publish Note

Use this when the note is ready to be part of the public archive.

Rules:

1. Set `draft: false`.
2. Set `status` to `published` or `evergreen`.
3. Make sure `description`, `tags`, and `id` are present.
4. Choose the category by reader intent:
   - `tutorial` for build-from-zero walkthroughs
   - `troubleshooting` for concrete problem/fix writeups
   - `lab-notes` for partial but useful experiments
   - other categories for everything else
5. `promote` is the command that should normally move a note out of draft mode.

### Revise Note

Use this when a note already exists and needs correction, expansion, or reframing.

Rules:

1. Match by `id` first. If `id` is missing, match by slug and topic before creating anything new.
2. Preserve `id` and `date`.
3. Update `updated` when the change is substantive.
4. If the new note fully replaces an older one, create or update the new note and list the old note id in `supersedes`.
5. If the old note is now obsolete, mark it `status: archived` instead of deleting history blindly.

## Duplication Rule

If an agent finds two posts that appear to cover the same topic:

1. Prefer the note with the better slug or existing backlinks.
2. Merge useful information into one canonical note.
3. Add `supersedes` on the winning note.
4. Archive the weaker duplicate if it should no longer be treated as current.

## Public Consumption Rule

- Agents consuming the published site should start with `/knowledge.json`
- `/llms.txt` is a lightweight guide and note listing
- `/api/search` is useful for full-text lookup, not for authoritative metadata
