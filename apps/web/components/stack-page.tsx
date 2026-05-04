"use client";

import { useState } from "react";
import { getStackByCategory } from "@/lib/stack";
import type { StackTool, StackStatus } from "@/lib/stack";

const statusConfig: Record<StackStatus, { label: string; className: string }> =
  {
    using: {
      label: "Using",
      className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    },
    dropped: {
      label: "Dropped",
      className: "bg-red-500/10 text-red-500 border-red-500/20",
    },
    watching: {
      label: "Watching",
      className: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    },
    replaced: {
      label: "Replaced",
      className:
        "bg-fd-muted text-fd-muted-foreground border-fd-border",
    },
  };

function ToolLogo({ tool }: { tool: StackTool }) {
  const [failed, setFailed] = useState(false);
  const isGitHub = tool.url?.includes("github.com");
  const src = tool.logo || (!isGitHub && tool.url ? getFaviconUrl(tool.url) : null);

  if (!src || failed) {
    return (
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-fd-border bg-fd-muted text-[11px] font-bold text-fd-foreground/70">
        {tool.name[0]}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt=""
      width={20}
      height={20}
      className="h-5 w-5 shrink-0 rounded object-contain"
      onError={() => setFailed(true)}
    />
  );
}

function StatusBadge({ status }: { status: StackStatus }) {
  const config = statusConfig[status];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.className}`}
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

function ToolCard({ tool }: { tool: StackTool }) {
  return (
    <div className="rounded-xl border border-fd-border bg-fd-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <ToolLogo tool={tool} />
          <h3 className="text-sm font-semibold">
            {tool.url ? (
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-fd-primary transition-colors"
              >
                {tool.name}
              </a>
            ) : (
              tool.name
            )}
          </h3>
        </div>
        <StatusBadge status={tool.status} />
      </div>
      <div className="mt-1 pl-[30px]">

          {tool.url && (
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-fd-muted-foreground hover:text-fd-primary transition-colors"
            >
              {getDomain(tool.url)}
            </a>
          )}

          {tool.replacedBy && (
            <p className="mt-1 text-xs text-fd-muted-foreground">
              Replaced by {tool.replacedBy}
            </p>
          )}

          {tool.take && (
            <p className="mt-2 text-sm leading-relaxed text-fd-foreground/90">
              {tool.take}
            </p>
          )}

          {tool.history && tool.history.length > 0 && (
            <details className="mt-3 group">
              <summary className="cursor-pointer text-xs text-fd-muted-foreground hover:text-fd-foreground transition-colors select-none">
                Changelog ({tool.history.length})
              </summary>
              <ul className="mt-2 space-y-1.5 border-l-2 border-fd-border pl-3">
                {tool.history.map((entry, i) => (
                  <li key={i} className="text-xs">
                    <span className="text-fd-muted-foreground">
                      {entry.date}
                    </span>
                    <span className="ml-2 text-fd-foreground/80">
                      {entry.note}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          )}
      </div>
    </div>
  );
}

export default function StackPage() {
  const grouped = getStackByCategory();
  const categories = Object.keys(grouped);

  return (
    <div className="space-y-8 not-prose">
      {categories.map((category) => (
        <section key={category}>
          <h2 className="mb-3 text-lg font-semibold text-fd-foreground">
            {category}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {grouped[category].map((tool) => (
              <ToolCard key={tool.name} tool={tool} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
