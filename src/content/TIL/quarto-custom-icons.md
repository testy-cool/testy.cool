---
title: "Quarto Icons & Extension Path Resolution"
description: "Using Font Awesome 6.5.2+ instead of iconify"
published: 2025-01-01
---

## Context

Quarto extensions like `iconify` can be installed using:

```bash
quarto add mcanouil/quarto-iconify
```

This creates an `_extensions` directory in your project root with the extension files.

## The Problem

Quarto resolves extension paths relative to each document's location instead of the project root:

- Works for files in root directory (`index.qmd`)
- Fails for files in subdirectories (`posts/article.qmd`, `pages/about.qmd`)

Here's the directory structure:

```
my-blog/
├── _extensions/          # Created by quarto add
│   └── mcanouil/
│       └── iconify/
├── index.qmd             ✅ Works (finds _extensions/mcanouil/iconify)
├── posts/
│   └── article.qmd      ❌ Fails (looks for posts/_extensions/mcanouil/iconify)
└── pages/
    └── about.qmd        ❌ Fails (looks for pages/_extensions/mcanouil/iconify)
```

## Attempted Solutions

1. **Project Configuration**:
   - Tried individual `_quarto.yml` files in each directory
   - Tried absolute paths
   - None of these resolved the path issue

2. **File System Solutions**:
   - Tried symlinks (requires admin privileges on Windows)
   - Tried duplicating `_extensions` directory (didn't work for me, maybe I didn't copy it correctly)

## Working Solution: Font Awesome

First, added Font Awesome to `_quarto.yml`:

```yaml
format:
  html:
    css:
      - https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css
```

:::note
Maybe adding the entire Font Awesome library affects website speed but at this point I honestly don't care. I wasted 4 hours on this already.
:::

Now I can finally use a custom icon in my navbar configuration:

```yaml
navbar:
  right:
    - text: "<i class='fa-brands fa-bluesky'></i>"
      href: https://bsky.app/profile/testycool.bsky.social
```

Note: The Bluesky icon specifically requires Font Awesome 6.5.2 or newer. Earlier versions don't include it. 