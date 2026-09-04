import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Hero from "@/components/hero";
import { Section } from "@/components/section";
import { GridBackground } from "@repo/ui/components/grid-background";
import { getVisiblePosts } from "@/lib/source";
import type { BlogPost } from "@repo/fumadocs-blog/blog";
import { organizationSchema, websiteSchema } from "@/lib/jsonld";
import { allTools, getToolUrl } from "@/lib/tools";
import { createMetadata } from "@/lib/metadata";
import { getCategoryBySlug } from "@/lib/categories";
import { BlogPostRow, type SitePost } from "@/components/blog-post-row";
import { MetaPill, SectionHeading } from "@/components/site";

export const metadata = createMetadata({ path: "https://testy.cool" });

const featuredSlugs = [
  "video-breakdown",
  "llm-price-calculator",
  "clamp-calculator",
];
const featuredTools = featuredSlugs
  .map((slug) => allTools.find((tool) => tool.slug === slug))
  .filter((tool): tool is NonNullable<typeof tool> => Boolean(tool))
  .map((tool) => ({
    title: tool.title,
    description: tool.description,
    href: getToolUrl(tool),
    type: tool.type,
  }));

function sortPosts(posts: BlogPost[]): SitePost[] {
  return posts
    .filter((post): post is SitePost => post !== undefined && post !== null)
    .sort(
      (left, right) => right.data.date.getTime() - left.data.date.getTime(),
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
    <article className="-mx-3 min-w-0 rounded-2xl border-b border-fd-border/80 px-3 py-4 transition-colors last:border-b-0 hover:bg-fd-background/75">
      <div className="mb-2">
        <MetaPill>{type}</MetaPill>
      </div>
      <h3 className="text-base font-semibold tracking-tight text-balance md:text-lg">
        <Link href={href} className="transition-colors hover:text-fd-primary">
          {title}
        </Link>
      </h3>
      <p className="mt-1 text-sm leading-6 text-fd-foreground/66">
        {description}
      </p>
    </article>
  );
}

function BrowseListItem({ title, href }: { title: string; href: string }) {
  return (
    <li className="border-b border-fd-border/80 last:border-b-0">
      <Link
        href={href}
        className="-mx-3 flex items-center justify-between gap-4 rounded-xl px-3 py-3 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-background/85 hover:text-fd-primary"
      >
        {title}
        <ArrowRight className="size-4 text-fd-foreground/55" />
      </Link>
    </li>
  );
}

export default function HomePage() {
  const posts = sortPosts(getVisiblePosts());
  const recentPosts = posts.slice(0, 4);
  const categorySlugs = [
    ...new Set(
      posts
        .map((post) => post.slugs?.[0])
        .filter((slug): slug is string => Boolean(slug)),
    ),
  ].sort();
  const browseItems = [
    { title: "All posts", href: "/blog" },
    ...categorySlugs.map((slug) => ({
      title: getCategoryBySlug(slug).label,
      href: `/blog/${slug}`,
    })),
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
          <div className="rounded-3xl border border-fd-border bg-fd-card p-6 shadow-sm">
            <SectionHeading
              eyebrow="Blog"
              title="Latest Posts"
              description="Newest first."
              href="/blog"
              hrefLabel="Browse Blog"
              eyebrowClassName="text-fd-primary"
            />
            {recentPosts.length > 0 ? (
              <div className="mt-6">
                {recentPosts.map((post) => (
                  <BlogPostRow key={post.url} post={post} />
                ))}
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">
                No posts yet.
              </p>
            )}
          </div>

          <div className="grid gap-6">
            <div className="rounded-3xl border border-fd-border bg-fd-muted/45 p-6">
              <SectionHeading
                eyebrow="Start Here"
                title="Browse"
                description="By category."
                eyebrowClassName="text-fd-foreground/62"
              />
              <ul className="mt-6">
                {browseItems.map((item) => (
                  <BrowseListItem key={item.href} {...item} />
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-fd-border bg-fd-muted/45 p-6">
              <SectionHeading
                eyebrow="Tools"
                title="A Few Tools"
                description="Things I built and use."
                href="/tools"
                hrefLabel="All Tools"
                eyebrowClassName="text-fd-foreground/62"
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
