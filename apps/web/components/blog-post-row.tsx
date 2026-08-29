import Link from "next/link";
import type { BlogPost } from "@repo/fumadocs-blog/blog";
import { getCategoryBySlug } from "@/lib/categories";

export type SitePost = NonNullable<BlogPost>;

const dateFormatter = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

/** One post as a compact row: category, date, title, one line of description. */
export function BlogPostRow({ post }: { post: SitePost }) {
  const category = post.slugs?.[0];
  const label = category ? getCategoryBySlug(category).label : "Note";
  const date: Date = post.data.date;

  return (
    <article className="-mx-3 min-w-0 rounded-2xl border-b border-fd-border/80 px-3 py-4 transition-colors last:border-b-0 hover:bg-fd-primary/[0.08]">
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium uppercase tracking-[0.16em]">
        <span className="inline-flex rounded-full border border-fd-primary/15 bg-fd-primary/8 px-2.5 py-1 text-fd-primary">
          {label}
        </span>
        <time dateTime={date.toISOString()} className="text-fd-muted-foreground">
          {dateFormatter.format(date)}
        </time>
      </div>
      <h3 className="text-base font-semibold tracking-tight text-balance md:text-lg">
        <Link
          href={post.url}
          className="transition-colors hover:text-fd-primary"
        >
          {post.data.title}
        </Link>
      </h3>
      <p className="mt-1 text-sm leading-6 text-fd-foreground/66">
        {post.data.description}
      </p>
    </article>
  );
}
