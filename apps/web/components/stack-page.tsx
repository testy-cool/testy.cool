"use client";

import { useState } from "react";
import { getStackByCategory } from "@/lib/stack";
import type { StackTool, StackStatus } from "@/lib/stack";
import { MetaPill, SectionHeading, SiteSurface } from "@/components/site";

const statusConfig: Record<StackStatus, { label: string; className: string }> =
  {
    using: {
      label: "Using",
      className: "border-fd-primary/25 bg-fd-primary/10 text-fd-primary",
    },
    dropped: {
      label: "Dropped",
      className: "border-red-500/20 bg-red-500/10 text-red-500",
    },
    watching: {
      label: "Watching",
      className:
        "border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    },
    replaced: {
      label: "Replaced",
      className: "border-fd-border bg-fd-muted text-fd-muted-foreground",
    },
  };

function ToolLogo({ tool }: { tool: StackTool }) {
  const [failed, setFailed] = useState(false);
  const isGitHub = tool.url?.includes("github.com");
  const src =
    tool.logo || (!isGitHub && tool.url ? getFaviconUrl(tool.url) : null);

  if (!src || failed) {
    return (
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-fd-border bg-fd-muted text-[13px] font-bold text-fd-foreground/70">
        {tool.name[0]}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      width={28}
      height={28}
      className="h-7 w-7 shrink-0 rounded-lg object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function StatusBadge({ status }: { status: StackStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[13px] font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function getFaviconUrl(url: string): string {
  const domain = getDomain(url);
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

function StackToolRow({ tool }: { tool: StackTool }) {
  return (
    <article className="-mx-3 min-w-0 rounded-2xl border-b border-fd-border/80 px-3 py-4 transition-colors hover:bg-fd-background/75 last:border-b-0">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <ToolLogo tool={tool} />
          <div className="min-w-0">
            <h3 className="text-base font-semibold leading-tight tracking-tight text-fd-foreground">
              {tool.url ? (
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-fd-primary"
                >
                  {tool.name}
                </a>
              ) : (
                tool.name
              )}
            </h3>

            {tool.url && (
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex max-w-full break-all text-[13px] text-fd-muted-foreground transition-colors hover:text-fd-primary"
              >
                {getDomain(tool.url)}
              </a>
            )}
          </div>
        </div>
        <StatusBadge status={tool.status} />
      </div>

      <div className="mt-3 sm:pl-10">
        {tool.replacedBy && (
          <p className="text-[13px] text-fd-muted-foreground">
            Replaced by {tool.replacedBy}
          </p>
        )}

        {tool.take && (
          <p className="mt-2 text-sm leading-6 text-fd-foreground/76">
            {tool.take}
          </p>
        )}

        {tool.history && tool.history.length > 0 && (
          <details className="group mt-3">
            <summary className="cursor-pointer select-none text-[13px] text-fd-muted-foreground transition-colors hover:text-fd-foreground">
              Changelog ({tool.history.length})
            </summary>
            <ul className="mt-2 space-y-2 border-l border-fd-border pl-3">
              {tool.history.map((entry, i) => (
                <li key={i} className="text-[13px] leading-5">
                  <span className="font-medium text-fd-muted-foreground">
                    {entry.date}
                  </span>
                  <span className="ml-2 text-fd-foreground/78">
                    {entry.note}
                  </span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </article>
  );
}

export default function StackPage() {
  const grouped = getStackByCategory();
  const categories = Object.entries(grouped);

  return (
    <div className="not-prose space-y-6">
      {categories.map(([category, tools]) => (
        <SiteSurface key={category} variant="muted">
          <div className="flex flex-col items-start gap-4 md:flex-row md:justify-between">
            <SectionHeading
              eyebrow="Stack"
              title={category}
              titleClassName="text-xl md:text-2xl"
            />
            <MetaPill>{tools.length} entries</MetaPill>
          </div>
          <div className="mt-5">
            {tools.map((tool) => (
              <StackToolRow key={tool.name} tool={tool} />
            ))}
          </div>
        </SiteSurface>
      ))}
    </div>
  );
}
