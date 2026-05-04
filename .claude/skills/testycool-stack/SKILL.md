---
name: testycool-stack
description: Read, update, and publish the /stack page on testy.cool. Add tools, update opinions, change statuses, append changelog entries. Always reads current state before making changes.
---

# /stack Page Manager

Manages the testy.cool /stack page - a living list of tools, services, and models with opinionated takes and changelogs.

## Data Location

- **Data file**: `apps/web/lib/stack.ts` - source of truth for all stack entries
- **Component**: `apps/web/components/stack-page.tsx` - renders the page
- **Page**: `apps/web/app/(home)/(mdx)/stack/page.mdx`

## Before Any Changes

1. Read `apps/web/lib/stack.ts` to see the current state
2. Understand what the user wants to change

## Operations

### Add a tool
Add a new entry to the `stack` array in `lib/stack.ts`:
- Required: `name`, `category`, `status`, `take` (can be empty string)
- Optional: `url`, `replacedBy`, `history`
- Use today's date for any history entry

### Update a take
Find the tool by name in the array and update the `take` field.

### Change status
Update the `status` field. If changing to "dropped" or "replaced", ask about `replacedBy`. Always append a history entry with today's date explaining the change.

### Add changelog entry
Append to the tool's `history` array: `{ date: "YYYY-MM-DD", note: "what changed" }`.

### Add a category
Just use a new category string on a tool - the page groups automatically.

## After Changes

1. Run `pnpm check-types` to verify
2. Run `pnpm build` to verify build
3. Commit with a descriptive message
4. Push to main
5. Deploy: `npx wrangler pages deploy apps/web/out --project-name=testy-cool`

## Writing Style

Match the blog voice - direct, opinionated, no fluff. "It works" is fine. A three-paragraph rant is also fine. No marketing copy.
