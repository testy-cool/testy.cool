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
    case "tools-tech":
      return "Tools & Tech";
    case "conceptual":
      return "Concept";
    case "solution":
      return "Solution";
    case "tech":
      return "Tech Note";
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

function BrowseLink({
  title,
  href,
  count,
}: {
  title: string;
  href: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-3 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-sm font-medium transition-colors hover:bg-muted/40"
    >
      <span>{title}</span>
      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        {count}
      </span>
    </Link>
  );
}

export default function HomePage() {
  const posts = sortPosts(getBlogPosts());
  const recentPosts = posts.slice(0, 5);
  const tutorialCount = posts.filter(
    (post) => getCategorySlug(post) === "tutorial",
  ).length;
  const troubleshootingCount = posts.filter(
    (post) => getCategorySlug(post) === "troubleshooting",
  ).length;
  const labNotesCount = posts.filter(
    (post) => getCategorySlug(post) === "lab-notes",
  ).length;
  const browseLinks = [
    { title: "Tutorials", href: "/blog/tutorial", count: tutorialCount },
    {
      title: "Troubleshooting",
      href: "/blog/troubleshooting",
      count: troubleshootingCount,
    },
    ...(labNotesCount > 0
      ? [
          {
            title: "Lab Notes",
            href: "/blog/lab-notes",
            count: labNotesCount,
          },
        ]
      : []),
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

      <Section className="relative px-4 py-8 lg:px-6 lg:py-12">
        <SectionHeading
          eyebrow="Posts"
          title="Recent Posts"
          description="Latest posts across the site. Tutorials and troubleshooting are the main buckets right now."
          href="/blog"
          hrefLabel="All Posts"
        />
        <div className="mt-6 flex flex-wrap gap-3">
          {browseLinks.map((link) => (
            <BrowseLink key={link.title} {...link} />
          ))}
        </div>
        {recentPosts.length > 0 ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentPosts.map((post) => (
              <PostCard key={post.url} post={post} />
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-muted-foreground">No posts yet.</p>
        )}
      </Section>

      <Section className="relative px-4 py-8 lg:px-6 lg:py-12">
        <SectionHeading
          eyebrow="Tools"
          title="A Few Tools"
          description="Standalone tools, tool-backed tutorials, and browser extensions."
          href="/tools"
          hrefLabel="All Tools"
        />
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {featuredTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>
      </Section>
    </div>
  );
}
