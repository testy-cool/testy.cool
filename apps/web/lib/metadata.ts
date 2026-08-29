import type { Metadata } from "next/types";

const SITE_URL = "https://testy.cool";
const SITE_NAME = "testy.cool";

const openGraphBase = {
  siteName: SITE_NAME,
  type: "website",
  locale: "en_US",
} as const;

const icons: Metadata["icons"] = {
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
};

export interface PageMetadataInput {
  /**
   * The root layout passes the template object. Pages pass a bare name and
   * the template adds "| testy.cool" once. Never add the suffix by hand.
   */
  title?: string | { template: string; default: string };
  description?: string;
  /** Page path such as "/tools/hnes". Becomes the canonical URL and og:url. */
  path?: string;
  /**
   * Path of a 1200x630 image such as "/tools-og/hnes/image.png". Only pages
   * that need their own image pass it. Everything else inherits the image
   * from app/(home)/opengraph-image.tsx, which only survives when the page
   * declares no openGraph block of its own.
   */
  image?: string;
}

/**
 * Builds page metadata with one rule: a page never declares openGraph unless
 * it also declares openGraph.images, because Next replaces the inherited
 * openGraph object wholesale and would drop the file-based image. Titles,
 * descriptions and twitter fields are inherited or auto-filled by Next.
 */
export function createMetadata({
  title,
  description,
  path,
  image,
}: PageMetadataInput): Metadata {
  const isRoot = typeof title === "object";

  const metadata: Metadata = {
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    alternates: {
      ...(path && { canonical: path }),
      types: {
        "application/rss+xml": "/api/rss.xml",
      },
    },
    icons,
  };

  if (isRoot) {
    metadata.openGraph = { ...openGraphBase, url: SITE_URL };
    metadata.twitter = {
      card: "summary_large_image",
      site: "@testy_cool",
      creator: "@testy_cool",
    };
  } else if (image) {
    metadata.openGraph = {
      ...openGraphBase,
      url: path ?? SITE_URL,
      images: [{ url: image, width: 1200, height: 630 }],
    };
  }

  return metadata;
}

export const baseUrl =
  process.env.NODE_ENV === "development"
    ? new URL("http://localhost:3000")
    : new URL(SITE_URL);
