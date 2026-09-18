import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createMetadata } from "@/lib/metadata";
import {
  changelogEntries,
  latestUpdate,
  type ChangelogType,
} from "@/lib/changelog";
import { MetaPill, SitePageHeader, SiteSurface } from "@/components/site";

export const metadata = createMetadata({
  title: "Changelog",
  description:
    "Chronological log of what was added, changed, or replaced across tools, stack, and notes on testy.cool.",
  path: "/changelog",
});

const defaultConfig = {
  label: "Site",
  className: "border-fd-border bg-fd-muted text-fd-muted-foreground",
};

const typeConfig: Record<ChangelogType, { label: string; className: string }> =
  {
    stack: {
      label: "Stack",
      className: "border-fd-primary/25 bg-fd-primary/10 text-fd-primary",
    },
    tool: {
      label: "Tool",
      className:
        "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    },
    post: {
      label: "Post",
      className:
        "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
    },
    site: defaultConfig,
  };

export default function ChangelogPage() {
  return (
    <>
      <SitePageHeader
        title="Changelog"
        description="Chronological log of what was added, changed, or replaced across tools, stack, and notes."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Changelog" }]}
      >
        <div className="flex flex-wrap items-center gap-2">
          <MetaPill>Updated {latestUpdate?.shortDate ?? "Recently"}</MetaPill>
          <MetaPill>{changelogEntries.length} entries</MetaPill>
        </div>
      </SitePageHeader>

      <section className="container px-4 py-8 lg:px-6 lg:py-12">
        <SiteSurface
          variant="card"
          className="divide-y divide-fd-border/70 p-0 sm:p-0"
        >
          {changelogEntries.map((entry) => {
            const config = typeConfig[entry.type] ?? defaultConfig;
            return (
              <article
                key={entry.id}
                className="flex flex-col gap-3 p-5 sm:p-6 transition-colors hover:bg-fd-muted/30"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.className}`}
                  >
                    {config.label}
                  </span>
                  <time
                    dateTime={entry.date}
                    className="text-xs font-mono text-fd-muted-foreground"
                  >
                    {entry.displayDate}
                  </time>
                </div>

                <div className="space-y-1">
                  <h2 className="text-base font-semibold tracking-tight text-fd-foreground md:text-lg">
                    {entry.href ? (
                      <Link
                        href={entry.href}
                        className="inline-flex items-center gap-1.5 transition-colors hover:text-fd-primary"
                      >
                        {entry.title}
                        <ArrowRight className="size-4 text-fd-muted-foreground" />
                      </Link>
                    ) : (
                      entry.title
                    )}
                  </h2>
                  <p className="text-sm leading-relaxed text-fd-foreground/75">
                    {entry.description}
                  </p>
                </div>
              </article>
            );
          })}
        </SiteSurface>
      </section>
    </>
  );
}
