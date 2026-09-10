import Link from "next/link";
import type { BlogPost } from "@repo/fumadocs-blog/blog";
import { MetaPill } from "@/components/site";
import { getCategoryBySlug, getKindLabel } from "@/lib/categories";

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
  // Drafts only ever render on the dev server, so this badge never ships.
  const isDraft = Boolean(post.data.draft);
  // Tried notes say what the thing was: a library, a CLI, an agent skill.
  const kind = post.data.kind;

  return (
    <Link
      href={post.url}
      className="group -mx-3 block min-w-0 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary focus-visible:ring-offset-2 focus-visible:ring-offset-fd-background"
    >
      <article className="rounded-2xl border-b border-fd-border/80 px-3 py-4 transition-colors last:border-b-0 group-hover:bg-fd-primary/[0.08]">
        <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] font-medium uppercase tracking-[0.16em]">
          <span className="inline-flex rounded-full border border-fd-primary/15 bg-fd-primary/8 px-2.5 py-1 text-fd-primary">
            {label}
          </span>
          {kind && <MetaPill>{getKindLabel(kind)}</MetaPill>}
          {isDraft && (
            <MetaPill className="border-amber-500/25 bg-amber-500/10 tracking-[0.16em] text-amber-700 dark:text-amber-400">
              Draft
            </MetaPill>
          )}
          <time
            dateTime={date.toISOString()}
            className="text-fd-muted-foreground"
          >
            {dateFormatter.format(date)}
          </time>
        </div>
        <h3 className="text-base font-semibold tracking-tight text-balance transition-colors group-hover:text-fd-primary md:text-lg">
          {post.data.title}
        </h3>
        <p className="mt-1 text-sm leading-6 text-fd-foreground/66">
          {post.data.description}
        </p>
      </article>
    </Link>
  );
}
