import { HomeDirectory } from "@/components/home-directory";
import { getVisiblePosts } from "@/lib/source";
import { organizationSchema, websiteSchema } from "@/lib/jsonld";
import { allTools, getToolUrl, TOOL_CATEGORIES } from "@/lib/tools";
import { createMetadata } from "@/lib/metadata";
import { getCategoryBySlug } from "@/lib/categories";

export const metadata = createMetadata({ path: "https://testy.cool" });

export default function HomePage() {
  const posts = getVisiblePosts().sort(
    (left, right) => right.data.date.getTime() - left.data.date.getTime(),
  );
  const categorySlugs = [...new Set(posts.map((post) => post.slugs[0]))].filter(
    (slug): slug is string => Boolean(slug),
  );

  const toolGroups = TOOL_CATEGORIES.map((category) => ({
    id: `tools-${category.id}`,
    title: category.label,
    entries: allTools
      .filter((tool) => tool.category === category.id)
      .map((tool) => ({
        title: tool.title,
        description: tool.description,
        // This directory runs in a separate Worker, outside the static export.
        href:
          tool.slug === "upcoming-domain-extensions"
            ? "https://testy.cool/upcoming-domain-extensions/"
            : getToolUrl(tool),
        keywords: [tool.slug, tool.type, ...(tool.tags ?? [])],
      })),
  })).filter((group) => group.entries.length > 0);

  const postGroups = categorySlugs.map((slug) => ({
    id: `writing-${slug}`,
    title: getCategoryBySlug(slug).label,
    href: `/blog/${slug}`,
    entries: posts
      .filter((post) => post.slugs[0] === slug)
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        href: post.url,
        keywords: [...post.slugs, ...(post.data.tags ?? [])],
      })),
  }));

  return (
    <div className="container w-full px-4 pb-12 lg:px-6 lg:pb-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([organizationSchema(), websiteSchema()]),
        }}
      />
      <header className="flex flex-col gap-2 py-8 lg:py-10">
        <h1 className="text-3xl font-semibold tracking-tight text-fd-foreground md:text-4xl">
          Mostly LLMs, mostly.
        </h1>
        <p className="text-base leading-7 text-fd-muted-foreground">
          Tools, extensions, experiments and practical notes. Find your way
          around.
        </p>
      </header>
      <HomeDirectory toolGroups={toolGroups} postGroups={postGroups} />
    </div>
  );
}
