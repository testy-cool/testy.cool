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
import type { PostCardProps } from "@repo/fumadocs-blog/blog";
import { BlogPostRow } from "@/components/blog-post-row";
import { getCategoryBySlug, getSeriesBySlug } from "@/lib/categories";

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
  paginationDescription: (page: number) => `Blog posts, page ${page}`,
  categoryPaginationTitle: (category: string, page: number) =>
    `${getCategoryBySlug(category).label} - Page ${page}`,
  categoryPaginationDescription: (category: string, page: number) =>
    `${getCategoryBySlug(category).label} posts, page ${page}`,
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
    PostCard: ({ post }: PostCardProps) => <BlogPostRow post={post} />,
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

export { getCategoryBySlug, getSeriesBySlug };
