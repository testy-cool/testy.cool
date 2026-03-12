import type { Metadata } from "next/types";
import { GridBackground } from "@repo/ui/components/grid-background";
import { cn } from "@repo/shadverse/lib/utils";
import { Button } from "@repo/shadverse/components/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@repo/shadverse/components/popover";
import { Badge } from "@repo/shadverse/components/badge";
import { Book } from "@repo/shadverse/components/ui/book";
import { Card } from "@repo/shadverse/components/card";
import type {
  BlogConstants,
  BlogConfiguration,
} from "@repo/fumadocs-blog/blog";
import { PostCard } from "@repo/fumadocs-blog/blog";
import {
  Brain,
  Book as LucideBook,
  Code,
  Cog,
  FlaskConical,
  Rocket,
  Wrench,
} from "lucide-react";

// Blog text constants that can be customized

export const blogConstants: BlogConstants = {
  // General
  blogTitle: "Blog",
  blogDescription:
    "Notes on LLMs, agents, automation and development. Mostly written for myself. There are a few tools here too.",
  siteName: "testy.cool",
  defaultAuthorName: "testy.cool",
  xUsername: "@testy_cool",
  // Pagination
  paginationTitle: (page: number) => `Blog - Page ${page}`,
  paginationDescription: (page: number) =>
    `Articles and thoughts - Page ${page}`,
  categoryPaginationTitle: (category: string, page: number) =>
    `${category.charAt(0).toUpperCase() + category.slice(1)} - Page ${page}`,
  categoryPaginationDescription: (category: string, page: number) =>
    `Articles in the ${category} category - Page ${page}`,
  // URLs
  blogBase: "/blog",
  blogOgImageBase: "blog-og",
  pageSize: 5,
};

export function createBlogMetadata(
  override: Metadata,
  blogConstants: BlogConstants,
): Metadata {
  // Derive values from the core properties
  const siteUrl = `https://${blogConstants.siteName}`;
  const author = {
    name: blogConstants.defaultAuthorName,
    url: siteUrl,
  };
  const creator = blogConstants.defaultAuthorName;

  return {
    ...override,
    authors: [author],
    creator: creator,
    openGraph: {
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      url: siteUrl,
      siteName: blogConstants.siteName,
      ...override.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      site: blogConstants.xUsername,
      creator: blogConstants.xUsername,
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      ...override.twitter,
    },
    alternates: {
      types: {
        "application/rss+xml": "/api/rss.xml",
      },
      ...override.alternates,
    },
    icons: {
      icon: [
        {
          media: "(prefers-color-scheme: light)",
          url: "/assets/light-logo.svg",
          href: "/assets/light-logo.svg",
        },
        {
          media: "(prefers-color-scheme: dark)",
          url: "/assets/dark-logo.svg",
          href: "/assets/dark-logo.svg",
        },
      ],
    },
  };
}

export function getBlogConfiguration(): BlogConfiguration {
  return {
    PostCard: PostCard,
    backgroundPattern: {
      enabled: true,
      component: <GridBackground maxWidthClass="container" />,
    },
    Button,
    Popover,
    PopoverContent,
    PopoverTrigger,
    Badge,
    Book,
    Card,
    cn,
    config: {
      blogBase: blogConstants.blogBase,
      blogOgImageBase: blogConstants.blogOgImageBase,
      pageSize: 5,
      siteUrl: `https://${blogConstants.siteName}`,
      defaultAuthorName: blogConstants.defaultAuthorName,
    },
  };
}

export const useBlogConfiguration = getBlogConfiguration;

// Moved from lib/categories.ts
export const getCategoryBySlug = (slug: string) => {
  const categories = {
    tutorial: {
      label: "Tutorials",
      icon: LucideBook,
      description: "Longer posts that build something up from zero.",
    },
    troubleshooting: {
      label: "Troubleshooting",
      icon: Wrench,
      description: "Notes on specific problems and the fixes that worked.",
    },
    "lab-notes": {
      label: "Lab Notes",
      icon: FlaskConical,
      description:
        "Short notes on what I tried, what happened, and what seems true so far.",
    },
    "tools-tech": {
      label: "Tools & Tech",
      icon: Cog,
      description:
        "Tooling notes, implementation details, and small experiments.",
    },
    conceptual: {
      label: "Concepts",
      icon: Brain,
      description: "Posts that are more about framing than implementation.",
    },
    solution: {
      label: "Solutions",
      icon: Rocket,
      description: "Problem-and-solution writeups.",
    },
    tech: {
      label: "Tech Notes",
      icon: Code,
      description: "General engineering notes and implementation details.",
    },
  };

  const fallbackLabel = slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    categories[slug as keyof typeof categories] || {
      label: fallbackLabel,
      icon: LucideBook,
      description: `Posts in ${fallbackLabel}.`,
    }
  );
};

export const getSeriesBySlug = (slug: string) => {
  const series = {
    x: {
      label: "Series X",
      icon: LucideBook,
      description:
        "A comprehensive series on Zero Trust security architecture.",
    },
    "building-react-component-library": {
      label: "Building React Component Library",
      icon: LucideBook,
      description: "A series on building a React component library.",
    },
    // Add more series here as needed
  };

  return (
    series[slug as keyof typeof series] || {
      label: slug.charAt(0).toUpperCase() + slug.slice(1),
      icon: LucideBook,
      description: `Articles in the ${slug.charAt(0).toUpperCase() + slug.slice(1)} series.`,
    }
  );
};
