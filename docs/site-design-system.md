# testy.cool Site Design System

This is a small site layer, not a standalone product design system. It exists so the homepage, posts, tools, stack, and static MDX pages feel like the same site.

## Source of Truth

- The homepage sets the visual rhythm: grid background, Fumadocs tokens, rounded editorial panels, compact rows, and subtle metadata pills.
- Individual posts set the reading surface: restrained typography, low-noise tags, clear metadata, and content-first spacing.
- Tools and catalog pages should extend that language instead of becoming generic app directories.

## Tokens

- Use Fumadocs tokens for site UI: `fd-background`, `fd-card`, `fd-border`, `fd-muted`, `fd-muted-foreground`, `fd-foreground`, and `fd-primary`.
- Use semantic colors only for real status states, and keep them small.
- Avoid raw one-off palette choices for page structure.

## Typography

- Page titles: `text-3xl md:text-5xl`, semibold, tight tracking.
- Section titles: `text-2xl md:text-3xl`, semibold.
- Card and row titles: `text-base` to `text-xl`, depending on density.
- Body UI copy: `text-sm` or `text-base`.
- Authored UI labels, badges, and metadata must not go below `13px`.

## Surfaces

- Large page and section panels use `rounded-3xl`.
- List rows use `rounded-2xl` with subtle borders and hover tints.
- Compact cards can use `rounded-xl` only inside tool internals where density matters.
- Prefer whitespace, token backgrounds, and light borders over heavy shadows.
- Do not nest decorative cards inside decorative cards.

## Components

The shared site primitives live in `apps/web/components/site/`:

- `SitePageHeader` for top-level page headers.
- `SectionHeading` for homepage-style section headings.
- `SiteSurface` for card, muted, and plain editorial panels.
- `MetaPill` for uppercase metadata.
- `TagPill` for readable tags.

Keep these primitives conservative. Add new variants only when at least two pages need them.
