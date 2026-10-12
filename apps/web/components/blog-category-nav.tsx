import Link from "next/link";
import { categoryPillVariants } from "@/components/site/category-pill";
import { getVisiblePosts } from "@/lib/source";
import { getCategoryBySlug } from "@/lib/categories";

/** Links to the blog index and to every category that has at least one post. */
export function BlogCategoryNav({ active }: { active?: string }) {
  const slugs = [
    ...new Set(
      getVisiblePosts()
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
            className={categoryPillVariants({ active: isActive })}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
