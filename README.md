# Blog Template with Fumadocs

A modern, fully-featured blog template built with Next.js, Fumadocs, and Turborepo. This template is production-ready and includes blog functionality, MDX support, OG image generation, and more.

## Features

- 📝 **MDX Blog** - Write blog posts in MDX with full component support
- 🎨 **Fumadocs UI** - Beautiful, customizable documentation and blog UI
- 🖼️ **OG Image Generation** - Automatic Open Graph image generation for posts
- 📱 **Responsive Design** - Mobile-first, fully responsive layout
- 🏷️ **Categories & Tags** - Organize posts with categories and tags
- 📚 **Series Support** - Group related posts into series
- 🔍 **Search** - Built-in static search functionality
- ⚡ **Fast** - Built with Next.js 15 and optimized for performance
- 🎯 **TypeScript** - Fully typed for better DX
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 📦 **Turborepo** - Monorepo setup for scalability

## Quick Start

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd rjv-blog
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Customize your site

#### Update Site Information

Replace all instances of `yourdomain.com` and `@yourusername` in the following files:

**Core Config Files:**
- `CNAME` - Your custom domain
- `apps/web/blog-configuration.tsx` - Blog settings (siteName, defaultAuthorName, xUsername)
- `apps/web/lib/metadata.ts` - Metadata (name, URLs, Twitter handle)
- `apps/web/app/layout.config.tsx` - Layout config (title, description, owner)

**Component Files:**
- `apps/web/components/hero.tsx` - Hero section (title, tagline, social links)
- `apps/web/components/simple-footer.tsx` - Footer copyright
- `apps/web/app/layout.tsx` - Page metadata template
- `apps/web/app/blog-og/[[...slug]]/route.tsx` - OG image generation
- `apps/web/app/(home)/layout.tsx` - Home layout social links

**Template Config:**
- `packages/ui/src/ohimg/template.tsx` - OG image template

**GitHub Workflows:**
- `.github/workflows/preview.yml`
- `.github/workflows/deploy_pages.yml`
- `.github/workflows/deploy.yml`

#### Quick Find & Replace

You can use your editor's find and replace to quickly update:
- Find: `yourdomain.com` → Replace with: `your-actual-domain.com`
- Find: `@yourusername` → Replace with: `@your_twitter_handle`
- Find: `Your Name` → Replace with: `Your Actual Name`
- Find: `Your tagline or description here` → Replace with: `Your actual tagline`

### 4. Add your logo

Replace the following logo files in `apps/web/public/assets/`:
- `logo.svg` - Main logo
- `light-logo.svg` - Logo for light mode (favicon)
- `dark-logo.svg` - Logo for dark mode (favicon)

### 5. Start development server

```bash
pnpm dev
```

Visit `http://localhost:3000` to see your blog.

## Project Structure

```
.
├── apps
│   └── web                  # Main Next.js application
│       ├── app             # Next.js app directory
│       ├── components      # React components
│       ├── content         # MDX blog posts
│       ├── lib             # Utilities and configs
│       └── public          # Static assets
├── packages
│   ├── ui                  # Shared UI components
│   ├── shadverse          # Shadcn components
│   └── fumadocs-blog      # Blog functionality
└── .github/workflows      # CI/CD workflows
```

## Writing Blog Posts

Create a new MDX file in `apps/web/content/blog/`:

```mdx
---
title: Your Post Title
description: A brief description of your post
date: 2025-01-02
author: Your Name
tags: [tag1, tag2]
image: https://example.com/og-image.jpg
draft: false
series: optional-series-name
seriesPart: 1
---

Your post content here using MDX...
```

### Frontmatter Fields

- `title` (required) - Post title
- `description` (required) - Post description for SEO
- `date` (required) - Publication date
- `author` (required) - Author name
- `tags` (optional) - Array of tags
- `image` (optional) - Custom OG image URL
- `draft` (optional) - Set to true to hide from production
- `series` (optional) - Series slug to group posts
- `seriesPart` (optional) - Order within series

## Customization

### Categories

Edit categories in `apps/web/blog-configuration.tsx`:

```tsx
export const getCategoryBySlug = (slug: string) => {
  const categories = {
    "your-category": {
      label: "Your Category",
      icon: YourIcon,
      description: "Category description",
    },
    // Add more categories
  };
  // ...
};
```

### Series

Edit series in the same file:

```tsx
export const getSeriesBySlug = (slug: string) => {
  const series = {
    "your-series": {
      label: "Your Series Name",
      icon: LucideBook,
      description: "Series description",
    },
    // Add more series
  };
  // ...
};
```

### Styling

- Global styles: `apps/web/app/styles/globals.css`
- Tailwind config: `apps/web/tailwind.config.ts`
- Component styles: Use Tailwind utility classes

## Deployment

### GitHub Pages

The template includes GitHub Actions workflows for deployment:

1. **Automatic Deployment** - Pushes to `main` branch trigger deployment
2. **Manual Deployment** - Use workflow dispatch
3. **Preview Deployments** - Pull requests get preview deployments

Make sure to:
1. Enable GitHub Pages in your repository settings
2. Set the source to "GitHub Actions"
3. Update `CNAME` file with your custom domain (if using one)

### Other Platforms

The blog can be deployed to:
- **Vercel** - Zero-config deployment
- **Netlify** - Add `netlify.toml` configuration
- **Cloudflare Pages** - Connect your repository

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Start only web app
pnpm web:dev

# Build all apps
pnpm build

# Build only web app
pnpm web:build

# Lint code
pnpm lint

# Format code
pnpm format

# Type check
pnpm check-types
```

## Tech Stack

- **Framework** - [Next.js 15](https://nextjs.org/)
- **Content** - [MDX](https://mdxjs.com/) with [Fumadocs MDX](https://fumadocs.vercel.app/)
- **UI** - [Fumadocs UI](https://fumadocs.vercel.app/)
- **Styling** - [Tailwind CSS](https://tailwindcss.com/)
- **Components** - [shadcn/ui](https://ui.shadcn.com/)
- **Icons** - [Lucide Icons](https://lucide.dev/)
- **Monorepo** - [Turborepo](https://turbo.build/)
- **Package Manager** - [pnpm](https://pnpm.io/)

## Credits

This template is built on top of:
- [Fumadocs](https://fumadocs.vercel.app/) - Documentation framework
- [Turborepo](https://turbo.build/) - Monorepo starter

## License

MIT License - feel free to use this template for your own blog!

## Support

If you encounter any issues or have questions:
1. Check existing documentation
2. Search for similar issues
3. Create a new issue with detailed information

---

**Happy blogging! 🚀**
