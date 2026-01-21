export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "testy.cool",
    url: "https://testy.cool",
    logo: "https://testy.cool/avatar.webp",
    sameAs: [
      "https://x.com/testy_cool",
      "https://github.com/testy-cool",
      "https://bsky.app/profile/testycool.bsky.social",
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "testy.cool",
    url: "https://testy.cool",
    description: "Notes on LLMs, agents, automation and development. Tools too.",
  };
}

export function blogPostingSchema({
  title,
  description,
  date,
  author,
  url,
  image,
}: {
  title: string;
  description: string;
  date: Date;
  author: string;
  url: string;
  image?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: description,
    datePublished: date.toISOString(),
    author: {
      "@type": "Person",
      name: author,
      url: "https://testy.cool",
    },
    publisher: {
      "@type": "Organization",
      name: "testy.cool",
      url: "https://testy.cool",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    ...(image && { image }),
  };
}
