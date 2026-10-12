import Link from "next/link";
import Image from "next/image";
import Hero from "@/components/hero";
import { Badge } from "@repo/shadverse/components/badge";
import { Button } from "@repo/shadverse/components/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/shadverse/components/card";
import { getVisiblePosts } from "@/lib/source";
import type { BlogPost } from "@repo/fumadocs-blog/blog";
import { organizationSchema, websiteSchema } from "@/lib/jsonld";
import { allTools, getToolUrl } from "@/lib/tools";
import { createMetadata } from "@/lib/metadata";
import { getCategoryBySlug } from "@/lib/categories";
import type { SitePost } from "@/components/blog-post-row";
import { SectionHeading } from "@/components/site";

export const metadata = createMetadata({ path: "https://testy.cool" });

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

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
    screenshot: tool.screenshot,
  }));

function sortPosts(posts: BlogPost[]): SitePost[] {
  return posts
    .filter((post): post is SitePost => post !== undefined && post !== null)
    .sort(
      (left, right) => right.data.date.getTime() - left.data.date.getTime(),
    );
}

/** Keep the writing first; generic share images repeat the headline. */
function PostCard({ post }: { post: SitePost }) {
  const category = post.slugs?.[0];
  const label = category ? getCategoryBySlug(category).label : "Note";
  const date: Date = post.data.date;
  return (
    <Link
      href={post.url}
      className="group block min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary focus-visible:ring-offset-2 focus-visible:ring-offset-fd-background"
    >
      <Card role="article" className="h-full">
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">{label}</Badge>
            <time
              dateTime={date.toISOString()}
              className="text-sm text-fd-muted-foreground"
            >
              {dateFormatter.format(date)}
            </time>
          </div>
          <CardTitle>
            <h3 className="text-lg leading-snug group-hover:underline group-hover:underline-offset-4">
              {post.data.title}
            </h3>
          </CardTitle>
          <CardDescription className="line-clamp-3 leading-6">
            {post.data.description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

/** Tools share the same card composition as the posts above them. */
function ToolCard({
  title,
  description,
  href,
  type,
  screenshot,
}: {
  title: string;
  description: string;
  href: string;
  type: string;
  screenshot?: string;
}) {
  return (
    <Link
      href={href}
      className="group block min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary focus-visible:ring-offset-2 focus-visible:ring-offset-fd-background"
    >
      <Card role="article" className="h-full gap-4 overflow-hidden pt-0">
        {screenshot ? (
          <Image
            src={screenshot}
            alt=""
            width={800}
            height={450}
            className="aspect-video w-full object-cover"
          />
        ) : null}
        <CardHeader className="gap-3">
          <Badge variant="outline">{type}</Badge>
          <CardTitle>
            <h3 className="text-lg leading-snug group-hover:underline group-hover:underline-offset-4">
              {title}
            </h3>
          </CardTitle>
          <CardDescription className="line-clamp-3 leading-6">
            {description}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

function BrowseChip({ title, href }: { title: string; href: string }) {
  return (
    <Button asChild variant="outline">
      <Link href={href}>{title}</Link>
    </Button>
  );
}

export default function HomePage() {
  const posts = sortPosts(getVisiblePosts());
  const recentPosts = posts.slice(0, 6);
  const categorySlugs = [
    ...new Set(
      posts
        .map((post) => post.slugs?.[0])
        .filter((slug): slug is string => Boolean(slug)),
    ),
  ].sort();
  const browseItems = categorySlugs.map((slug) => ({
    title: getCategoryBySlug(slug).label,
    href: `/blog/${slug}`,
  }));

  return (
    <div className="container flex w-full flex-col px-4 pb-12 lg:px-6 lg:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationSchema(), websiteSchema()]),
        }}
      />
      <Hero />

      <div className="flex flex-col gap-12 lg:gap-16">
        <section aria-label="Latest posts">
          <SectionHeading
            title="Latest Posts"
            href="/blog"
            hrefLabel="All posts"
          />
          <nav
            aria-label="Browse blog categories"
            className="mt-5 flex flex-wrap gap-2"
          >
            {browseItems.map((item) => (
              <BrowseChip key={item.href} {...item} />
            ))}
          </nav>
          {recentPosts.length > 0 ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {recentPosts.map((post) => (
                <PostCard key={post.url} post={post} />
              ))}
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">No posts yet.</p>
          )}
        </section>

        <section aria-label="Featured tools">
          <SectionHeading
            title="Tools"
            description="Things I built and use."
            href="/tools"
            hrefLabel="All Tools"
          />
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {featuredTools.map((tool) => (
              <ToolCard key={tool.title} {...tool} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
