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

function ToolListItem({
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
    <article className="min-w-0 border-b border-border/60 py-5 last:border-b-0">
      <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {type}
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-balance md:text-xl">
        <Link href={href} className="hover:underline">
          {title}
        </Link>
      </h3>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        {description}
      </p>
      <Link
        href={href}
        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
      >
        {cta}
        <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

function PostListItem({ post }: { post: SitePost }) {
  const category = getCategorySlug(post);

  return (
    <article className="min-w-0 border-b border-border/60 py-5 last:border-b-0">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
        <span>{getCategoryLabel(category)}</span>
        <span className="text-border">/</span>
        <span>{dateFormatter.format(post.data.date)}</span>
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-balance md:text-xl">
        <Link href={post.url} className="hover:underline">
          {post.data.title}
        </Link>
      </h3>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
        {post.data.description}
      </p>
      <Link
        href={post.url}
        className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
      >
        Read Post
        <ArrowRight className="size-4" />
      </Link>
    </article>
  );
}

export default function HomePage() {
  const posts = sortPosts(getBlogPosts());
  const recentPosts = posts.slice(0, 6);

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
          eyebrow="Blog"
          title="Recent Posts"
          description="Most of the site lives in the blog archive."
          href="/blog"
          hrefLabel="Browse Blog"
        />
        {recentPosts.length > 0 ? (
          <div className="mt-8 rounded-3xl border border-border/70 bg-background/70 px-6">
            {recentPosts.map((post) => (
              <PostListItem key={post.url} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">No posts yet.</p>
        )}
      </Section>

      <Section className="relative px-4 py-8 lg:px-6 lg:py-12">
        <SectionHeading
          eyebrow="Tools"
          title="Tools"
          description="A few standalone tools, tool-backed posts, and extensions."
          href="/tools"
          hrefLabel="All Tools"
        />
        <div className="mt-8 rounded-3xl border border-border/70 bg-background/70 px-6">
          {featuredTools.map((tool) => (
            <ToolListItem key={tool.title} {...tool} />
          ))}
        </div>
      </Section>
    </div>
  );
}
