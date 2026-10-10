const PERSON_ID = "https://testy.cool/about#me";

export function personSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Vlad Eduard Rădulescu",
    url: "https://testy.cool/about",
    sameAs: [
      "https://www.linkedin.com/in/vladeduard/",
      "https://github.com/testy-cool",
      "https://x.com/testy_cool",
      "https://bsky.app/profile/testycool.bsky.social",
    ],
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "testy.cool",
    url: "https://testy.cool",
    logo: "https://testy.cool/avatar.webp",
    founder: { "@id": PERSON_ID },
    sameAs: [
      "https://x.com/testy_cool",
      "https://github.com/testy-cool",
      "https://bsky.app/profile/testycool.bsky.social",
      "https://chromewebstore.google.com/detail/hacker-news-enhancement-s/ebmjdaaabekgefdnfkcoejejhkodkepg",
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "testy.cool",
    alternateName: ["testy cool", "testycool"],
    url: "https://testy.cool",
    description:
      "Notes on LLMs, agents, automation and development. Mostly written for myself. There are a few tools here too.",
  };
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
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
    author:
      author === "testy.cool"
        ? {
            "@type": "Person",
            "@id": PERSON_ID,
            name: "Vlad Eduard Rădulescu",
            url: "https://testy.cool/about",
          }
        : { "@type": "Person", name: author, url: "https://testy.cool" },
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
