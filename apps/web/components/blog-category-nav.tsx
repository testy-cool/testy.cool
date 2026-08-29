import Link from "next/link";
import { cn } from "@repo/shadverse/lib/utils";
import { getBlogPosts } from "@/lib/source";
import { getCategoryBySlug } from "@/lib/categories";

/** Links to the blog index and to every category that has at least one post. */
export function BlogCategoryNav({ active }: { active?: string }) {
  const slugs = [
    ...new Set(
      getBlogPosts()
        .map((post) => post?.slugs?.[0])
        .filter((slug): slug is string => Boolean(slug)),
    ),
  ].sort();

  const items = [
    { slug: undefined, label: "All", href: "/blog" },
    ...slugs.map((slug) => ({
      slug,
      label: getCategoryBySlug(slug).label,
      href: `/blog/${slug}`,
    })),
  ];

  return (
    <nav aria-label="Categories" className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = item.slug === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-[13px] font-medium transition-colors",
              isActive
                ? "border-fd-primary/30 bg-fd-primary/10 text-fd-primary"
                : "border-fd-border bg-fd-background/85 text-fd-foreground/72 hover:border-fd-primary/40 hover:text-fd-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
