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

const pathCards = [
  {
    title: "Tutorials",
    description:
      "Longer posts where I work through something from first principles.",
    href: "/blog/tutorial",
  },
  {
    title: "Troubleshooting",
    description: "Specific problems, edge cases, and the fixes that worked.",
    href: "/blog/troubleshooting",
  },
  {
    title: "Tools",
    description:
      "Small utilities and browser extensions collected in one place.",
    href: "/tools",
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
      return "Fix";
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

function PathCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full min-w-0 flex-col justify-between rounded-2xl border border-border/70 bg-background/80 p-6 transition-colors hover:bg-muted/40"
    >
      <div className="space-y-3">
        <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Section
        </span>
        <h3 className="text-xl font-semibold tracking-tight text-balance">
          {title}
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">
        Go to section
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function ToolCard({
  title,
  description,
  href,
  type,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  type: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex h-full min-w-0 flex-col justify-between rounded-2xl border border-border/70 bg-background/80 p-6 transition-colors hover:bg-muted/40"
    >
      <div className="space-y-3">
        <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {type}
        </span>
        <h3 className="text-xl font-semibold tracking-tight text-balance">
          {title}
        </h3>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium">
        {cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function PostCard({ post }: { post: SitePost }) {
  const category = getCategorySlug(post);

  return (
    <article className="min-w-0 rounded-2xl border border-border/70 bg-background/80 p-5">
      <div className="mb-3 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        <span>{getCategoryLabel(category)}</span>
        <span className="text-border">/</span>
        <span>{dateFormatter.format(post.data.date)}</span>
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-balance">
        <Link href={post.url} className="hover:underline">
          {post.data.title}
        </Link>
      </h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {post.data.description}
      </p>
      <Link
        href={post.url}
        className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
      >
        Read Post
        <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

function PostStack({
  title,
  description,
  posts,
  href,
  hrefLabel,
  emptyMessage,
}: {
  title: string;
  description: string;
  posts: SitePost[];
  href: string;
  hrefLabel: string;
  emptyMessage: string;
}) {
  return (
    <div className="rounded-3xl border border-border/70 bg-background/70 p-6">
      <SectionHeading
        eyebrow={title}
        title={title}
        description={description}
        href={href}
        hrefLabel={hrefLabel}
      />
      {posts.length > 0 ? (
        <div className="mt-6 grid gap-4">
          {posts.map((post) => (
            <PostCard key={post.url} post={post} />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">{emptyMessage}</p>
      )}
    </div>
  );
}

export default function HomePage() {
  const posts = sortPosts(getBlogPosts());
  const tutorials = posts
    .filter((post) => getCategorySlug(post) === "tutorial")
    .slice(0, 2);
  const troubleshooting = posts
    .filter((post) => getCategorySlug(post) === "troubleshooting")
    .slice(0, 2);
  const notes = posts
    .filter(
      (post) =>
        !["tutorial", "troubleshooting"].includes(getCategorySlug(post)),
    )
    .slice(0, 3);

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

      <Section className="relative px-4 py-8 lg:px-6 lg:py-12">
        <SectionHeading
          eyebrow="Browse"
          title="How to browse"
          description="This site is a mix of tutorials, troubleshooting notes, and tools."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {pathCards.map((card) => (
            <PathCard key={card.title} {...card} />
          ))}
        </div>
      </Section>

      <Section className="relative px-4 py-8 lg:px-6 lg:py-12">
        <SectionHeading
          eyebrow="Tools"
          title="A few tools"
          description="Some have their own pages. Some live inside longer posts."
          href="/tools"
          hrefLabel="All Tools"
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {featuredTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </Section>

      <Section className="relative px-4 py-8 lg:px-6 lg:py-12">
        <div className="grid gap-6 xl:grid-cols-2">
          <PostStack
            title="Latest Tutorials"
            description="Longer posts that explain how something works and how I approached it."
            posts={tutorials}
            href="/blog/tutorial"
            hrefLabel="All Tutorials"
            emptyMessage="No tutorial posts yet."
          />
          <PostStack
            title="Recent Troubleshooting"
            description="Notes about specific problems and the fixes that worked."
            posts={troubleshooting}
            href="/blog/troubleshooting"
            hrefLabel="All Troubleshooting"
            emptyMessage="No troubleshooting posts published yet."
          />
        </div>
      </Section>

      <Section className="relative px-4 py-8 lg:px-6 lg:py-12">
        <SectionHeading
          eyebrow="Recent Notes"
          title="Other recent posts"
          description="Posts that do not fit the tutorial or troubleshooting buckets."
          href="/blog"
          hrefLabel="All Posts"
        />
        {notes.length > 0 ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {notes.map((post) => (
              <PostCard key={post.url} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">
            No other posts yet.
          </p>
        )}
      </Section>
    </div>
  );
}
