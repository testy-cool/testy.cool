import type { Metadata } from "next/types";

export function createMetadata(override: Metadata): Metadata {
  return {
    ...override,
    authors: [
      {
        name: "testy.cool",
        url: "https://testy.cool",
      },
    ],
    creator: "testy.cool",
    openGraph: {
      title: override.title ?? "testy.cool — Mostly LLMs, mostly.",
      description: override.description ?? "Notes on LLMs, agents, automation and development. Tools too. Primarily written for myself.",
      url: "https://testy.cool",
      siteName: "testy.cool",
      type: "website",
      locale: "en_US",
      ...override.openGraph,
    },
    twitter: {
      card: "summary_large_image",
      site: "@testy_cool",
      creator: "@testy_cool",
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

export const baseUrl =
  process.env.NODE_ENV === "development" || !process.env.NEXT_PUBLIC_SITE_URL
    ? new URL("http://localhost:3000")
    : new URL(`https://${process.env.NEXT_PUBLIC_SITE_URL}`);
