import Hero from "@/components/hero";
import { Section } from "@/components/section";
import { GridBackground } from "@repo/ui/components/grid-background";
import { getBlogPosts } from "@/lib/source";
import type { BlogPost } from "@repo/fumadocs-blog/blog";
import { organizationSchema, websiteSchema } from "@/lib/jsonld";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type SitePost = NonNullable<BlogPost>;

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const featuredTools = [
  {
    title: "LLM Price Calculator",
    description:
      "Calculator for checking API costs across Claude, GPT, and Gemini, including prompt caching.",
    href: "/tools/llm-price-calculator",
    type: "Standalone Tool",
    cta: "Open Tool",
  },
  {
    title: "CSS Clamp Calculator",
    description:
      "Clamp() calculator plus the tutorial explaining the math behind it.",
    href: "/blog/tutorial/css-clamp-fluid-responsive-design",
    type: "Tool + Tutorial",
    cta: "Read Tutorial",
  },
  {
    title: "ChatGPT Conversation Exporter",
    description:
      "Browser extension for exporting one ChatGPT conversation to Markdown or HTML.",
    href: "/tools/chatgpt-conversation-exporter",
    type: "Extension",
    cta: "View Extension",
  },
];

function sortPosts(posts: BlogPost[]): SitePost[] {
  return posts
    .filter((post): post is SitePost => post !== undefined && post !== null)
    .sort(
      (left, right) => right.data.date.getTime() - left.data.date.getTime(),
    );
}

function getCategorySlug(post: SitePost): string {
  return post.slugs?.[0] ?? "notes";
}

function getCategoryLabel(slug: string): string {
  switch (slug) {
    case "tutorial":
      return "Tutorial";
    case "troubleshooting":
      return "Troubleshooting";
    case "lab-notes":
      return "Lab Note";
    default:
      return "Note";
  }
}

function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  hrefLabel,
}: {
  eyebrow: string;
  title: string;
  description: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground md:text-base">
          {description}
        </p>
      </div>
      {href && hrefLabel ? (
        <Link
          href={href}
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
        >
          {hrefLabel}
          <ArrowRight className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

function CompactListItem({
  title,
  description,
  href,
  type,
}: {
  title: string;
  description: string;
  href: string;
  type: string;
}) {
  return (
    <article className="min-w-0 border-b border-border/60 py-4 last:border-b-0">
      <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {type}
      </div>
      <h3 className="text-base font-semibold tracking-tight text-balance md:text-lg">
        <Link
          href={href}
          className="transition-colors hover:text-muted-foreground"
        >
          {title}
        </Link>
      </h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

function PostListItem({ post }: { post: SitePost }) {
  const category = getCategorySlug(post);

  return (
    <article className="min-w-0 border-b border-border/60 py-4 last:border-b-0">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        <span>{getCategoryLabel(category)}</span>
        <span className="text-border">/</span>
        <span>{dateFormatter.format(post.data.date)}</span>
      </div>
      <h3 className="text-base font-semibold tracking-tight text-balance md:text-lg">
        <Link
          href={post.url}
          className="transition-colors hover:text-muted-foreground"
        >
          {post.data.title}
        </Link>
      </h3>
      <p className="mt-1 text-sm leading-6 text-muted-foreground">
        {post.data.description}
      </p>
    </article>
  );
}

function BrowseListItem({
  title,
  href,
  meta,
}: {
  title: string;
  href: string;
  meta: string;
}) {
  return (
    <li className="border-b border-border/60 last:border-b-0">
      <Link
        href={href}
        className="flex items-center justify-between gap-4 py-3 text-sm transition-colors hover:text-muted-foreground"
      >
        <span className="font-medium text-foreground">{title}</span>
        <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
          {meta}
        </span>
      </Link>
    </li>
  );
}

export default function HomePage() {
  const posts = sortPosts(getBlogPosts());
  const recentPosts = posts.slice(0, 4);
  const tutorialCount = posts.filter(
    (post) => getCategorySlug(post) === "tutorial",
  ).length;
  const troubleshootingCount = posts.filter(
    (post) => getCategorySlug(post) === "troubleshooting",
  ).length;
  const labNotesCount = posts.filter(
    (post) => getCategorySlug(post) === "lab-notes",
  ).length;
  const browseItems = [
    {
      title: "Blog Archive",
      href: "/blog",
      meta: `${posts.length} posts`,
    },
    {
      title: "Tutorials",
      href: "/blog/tutorial",
      meta: `${tutorialCount} posts`,
    },
    {
      title: "Troubleshooting",
      href: "/blog/troubleshooting",
      meta: `${troubleshootingCount} posts`,
    },
    ...(labNotesCount > 0
      ? [
          {
            title: "Lab Notes",
            href: "/blog/lab-notes",
            meta: `${labNotesCount} posts`,
          },
        ]
      : []),
    {
      title: "About",
      href: "/about",
      meta: "context",
    },
  ];

  return (
    <div className="flex flex-1 flex-col justify-center">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationSchema(), websiteSchema()]),
        }}
      />
      <div className="relative flex w-full flex-col items-center overflow-x-hidden text-center">
        <GridBackground maxWidthClass="container" />

        <div className="relative flex items-center justify-center w-full mx-auto container">
          <div className="space-y-8">
            <Hero />
          </div>
        </div>
      </div>

      <Section className="relative px-4 pb-8 lg:px-6 lg:pb-12">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,0.9fr)]">
          <div className="rounded-3xl border border-border/70 bg-background/70 p-6">
            <SectionHeading
              eyebrow="Blog"
              title="Latest Posts"
              description="Most of the site lives in the blog archive."
              href="/blog"
              hrefLabel="Browse Blog"
            />
            {recentPosts.length > 0 ? (
              <div className="mt-6">
                {recentPosts.map((post) => (
                  <PostListItem key={post.url} post={post} />
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                No posts yet.
              </p>
            )}
          </div>

          <div className="grid gap-6">
            <div className="rounded-3xl border border-border/70 bg-background/70 p-6">
              <SectionHeading
                eyebrow="Start Here"
                title="Browse"
                description="If you want the overall picture, start with the archive."
              />
              <ul className="mt-6">
                {browseItems.map((item) => (
                  <BrowseListItem key={item.title} {...item} />
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-border/70 bg-background/70 p-6">
              <SectionHeading
                eyebrow="Tools"
                title="A Few Tools"
                description="Small utilities and extensions."
                href="/tools"
                hrefLabel="All Tools"
              />
              <div className="mt-6">
                {featuredTools.map((tool) => (
                  <CompactListItem key={tool.title} {...tool} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
