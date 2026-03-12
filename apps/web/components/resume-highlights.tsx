import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getCategoryBySlug } from "@/blog-configuration";
import { getResumeNotes } from "@/lib/source";

const signalRank = {
  featured: 2,
  supporting: 1,
  none: 0,
} as const;

function formatSignal(signal: "featured" | "supporting" | "none") {
  if (signal === "featured") return "Featured";
  if (signal === "supporting") return "Supporting";
  return "Note";
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCategory(category: string) {
  return getCategoryBySlug(category).label;
}

export function ResumeHighlights({
  limit,
  title,
  description,
}: {
  limit?: number;
  title?: string;
  description?: string;
}) {
  const notes = getResumeNotes()
    .sort((left, right) => {
      const signalDelta =
        signalRank[right.resumeSignal] - signalRank[left.resumeSignal];

      if (signalDelta !== 0) return signalDelta;

      const rightFreshness = right.updated ?? right.date;
      const leftFreshness = left.updated ?? left.date;

      return rightFreshness.localeCompare(leftFreshness);
    })
    .slice(0, limit);

  if (notes.length === 0) return null;

  return (
    <div className="not-prose">
      {title || description ? (
        <div className="mb-5 space-y-2">
          {title ? (
            <h2 className="text-xl font-semibold tracking-tight text-balance">
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="text-sm leading-6 text-fd-foreground/66">
              {description}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4">
        {notes.map((note) => (
          <article
            key={note.id}
            className="rounded-2xl border border-fd-border bg-fd-card px-4 py-4 shadow-sm"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em]">
              <span className="inline-flex rounded-full border border-fd-primary/15 bg-fd-primary/8 px-2.5 py-1 text-fd-primary">
                {formatSignal(note.resumeSignal)}
              </span>
              <span className="text-fd-muted-foreground">
                {formatCategory(note.category)}
              </span>
              <span className="text-fd-muted-foreground">
                {formatDate(note.updated ?? note.date)}
              </span>
            </div>

            <h3 className="text-base font-semibold tracking-tight text-balance md:text-lg">
              <Link
                href={note.url}
                className="transition-colors hover:text-fd-primary"
              >
                {note.title}
              </Link>
            </h3>

            {note.description ? (
              <p className="mt-2 text-sm leading-6 text-fd-foreground/66">
                {note.description}
              </p>
            ) : null}

            {note.tags.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {note.tags.slice(0, 4).map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex rounded-full border border-fd-border bg-fd-background px-2 py-1 text-[11px] text-fd-foreground/72"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-4">
              <Link
                href={note.url}
                className="inline-flex items-center gap-2 text-sm font-medium text-fd-primary transition-colors hover:text-fd-primary/80"
              >
                Read note
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
