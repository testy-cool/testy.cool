"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Check, Sparkles, ExternalLink } from "lucide-react";
import {
  type Tool,
  type ToolCategory,
  TOOL_CATEGORIES,
  getToolUrl,
} from "@/lib/tools";
import { MetaPill, TagPill } from "@/components/site";

interface ToolsDirectoryProps {
  tools: Tool[];
}

function FeaturedToolCard({ tool }: { tool: Tool }) {
  const url = getToolUrl(tool);
  const isLiveSync = tool.badge?.includes("Live");

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-fd-border/90 bg-fd-card/95 p-5 shadow-sm transition-all hover:border-fd-primary/50 sm:p-7 md:p-8">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-center lg:gap-8">
        {tool.screenshot && (
          <div className="min-w-0 lg:col-span-5">
            <Link
              href={url}
              className="block w-full overflow-hidden rounded-2xl border border-fd-border bg-fd-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/30"
              tabIndex={-1}
            >
              <div className="aspect-[16/9] w-full overflow-hidden">
                <img
                  src={tool.screenshot}
                  alt={`${tool.title} preview`}
                  width={1280}
                  height={720}
                  loading="eager"
                  className="h-full w-full max-w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            </Link>
          </div>
        )}

        <div
          className={
            tool.screenshot ? "min-w-0 lg:col-span-7" : "min-w-0 lg:col-span-12"
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-fd-primary/30 bg-fd-primary/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-fd-primary">
              <Sparkles className="size-3.5" />
              Featured Workbench
            </span>
            {tool.badge && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-fd-border bg-fd-background/80 px-2.5 py-1 text-xs font-medium text-fd-foreground/80">
                {isLiveSync && (
                  <span className="inline-block size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
                {tool.badge}
              </span>
            )}
          </div>

          <h2 className="mt-3.5 text-2xl font-bold tracking-tight text-fd-foreground transition-colors group-hover:text-fd-primary md:text-3xl">
            <Link href={url} className="focus-visible:outline-none">
              {tool.title}
            </Link>
          </h2>

          <p className="mt-2.5 text-sm leading-relaxed text-fd-foreground/75 sm:text-base">
            {tool.description}
          </p>

          {tool.highlights && tool.highlights.length > 0 && (
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {tool.highlights.map((h, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs font-medium text-fd-foreground/80 sm:text-sm"
                >
                  <Check className="mt-0.5 size-4 shrink-0 text-fd-primary" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-fd-border/70 pt-4">
            {tool.tags && tool.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tool.tags.map((tag) => (
                  <TagPill key={tag}>{tag}</TagPill>
                ))}
              </div>
            )}

            <Link
              href={url}
              className="inline-flex items-center gap-2 rounded-xl bg-fd-primary px-4 py-2 text-sm font-semibold text-fd-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/40"
            >
              Launch Workbench
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

function StandardToolCard({ tool }: { tool: Tool }) {
  const url = getToolUrl(tool);
  const isExternal = url.startsWith("http://") || url.startsWith("https://");
  const isExtension = tool.type === "Extension";
  const isTutorial = tool.type === "Tutorial";
  const isLiveSync = tool.badge?.includes("Live");

  return (
    <Link
      href={url}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/30"
    >
      <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-fd-border/80 bg-fd-card shadow-sm transition-all duration-200 hover:border-fd-primary/50 hover:shadow-md">
        {tool.screenshot && (
          <div className="relative aspect-[16/9] w-full min-w-0 overflow-hidden border-b border-fd-border/80 bg-fd-muted/30">
            <img
              src={tool.screenshot}
              alt={`${tool.title} screenshot`}
              width={1280}
              height={720}
              loading="lazy"
              decoding="async"
              className="h-full w-full max-w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {tool.badge && (
              <div className="absolute top-3 right-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-fd-border/80 bg-fd-card/90 px-2.5 py-1 text-xs font-medium text-fd-foreground/85 shadow-sm backdrop-blur-xs">
                  {isLiveSync && (
                    <span className="inline-block size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  )}
                  {tool.badge}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="mb-2.5 flex flex-wrap items-center gap-2">
            <MetaPill>{tool.type}</MetaPill>
            {!tool.screenshot && tool.badge && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-fd-border bg-fd-background/80 px-2.5 py-1 text-xs font-medium text-fd-foreground/75">
                {isLiveSync && (
                  <span className="inline-block size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                )}
                {tool.badge}
              </span>
            )}
          </div>

          <h3 className="text-lg font-semibold leading-tight tracking-tight text-fd-foreground transition-colors group-hover:text-fd-primary md:text-xl">
            {tool.title}
          </h3>

          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-fd-foreground/72">
            {tool.description}
          </p>

          {tool.tags && tool.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tool.tags.map((tag) => (
                <TagPill key={tag}>{tag}</TagPill>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between border-t border-fd-border/60 pt-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-fd-foreground transition-colors group-hover:text-fd-primary">
              {isExtension
                ? "View Extension"
                : isTutorial
                  ? "Read Tutorial"
                  : "Open Tool"}
              {isExternal ? (
                <ExternalLink className="size-4" />
              ) : (
                <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              )}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function ToolsDirectory({ tools }: ToolsDirectoryProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    ToolCategory | "all"
  >("all");

  const featuredTools = useMemo(() => tools.filter((t) => t.featured), [tools]);

  const filteredTools = useMemo(() => {
    if (selectedCategory === "all") return tools;
    return tools.filter((t) => t.category === selectedCategory);
  }, [tools, selectedCategory]);

  const countsByCategory = useMemo(() => {
    const counts: Record<string, number> = { all: tools.length };
    for (const c of TOOL_CATEGORIES) {
      counts[c.id] = tools.filter((t) => t.category === c.id).length;
    }
    return counts;
  }, [tools]);

  return (
    <div className="space-y-10 sm:space-y-12">
      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-fd-border/70 pb-4">
        <button
          onClick={() => setSelectedCategory("all")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/30 ${
            selectedCategory === "all"
              ? "border border-fd-primary/50 bg-fd-card text-fd-foreground shadow-sm ring-1 ring-fd-border"
              : "border border-fd-border/80 bg-fd-background/70 text-fd-muted-foreground hover:bg-fd-muted/50 hover:text-fd-foreground"
          }`}
        >
          <span>All</span>
          <span className="rounded-full bg-fd-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-fd-foreground/75">
            {countsByCategory.all}
          </span>
        </button>

        {TOOL_CATEGORIES.map((cat) => {
          const count = countsByCategory[cat.id] ?? 0;
          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[14px] font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/30 ${
                isActive
                  ? "border border-fd-primary/50 bg-fd-card text-fd-foreground shadow-sm ring-1 ring-fd-border"
                  : "border border-fd-border/80 bg-fd-background/70 text-fd-muted-foreground hover:bg-fd-muted/50 hover:text-fd-foreground"
              }`}
            >
              <span>{cat.label}</span>
              <span className="rounded-full bg-fd-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-fd-foreground/75">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Featured Spotlight (shown on "All" or when filtering for AI & Prompting) */}
      {(selectedCategory === "all" || selectedCategory === "ai-prompting") &&
        featuredTools.length > 0 && (
          <div className="space-y-6">
            <div className="flex flex-col gap-1 border-b border-fd-border/70 pb-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[13px] font-semibold uppercase tracking-[0.22em] text-fd-primary">
                  Spotlight
                </p>
                <h3 className="text-xl font-bold tracking-tight text-fd-foreground sm:text-2xl">
                  Flagship Workbenches
                </h3>
                <p className="mt-0.5 text-sm text-fd-muted-foreground">
                  Interactive tools with real-time models and exportable
                  workflows.
                </p>
              </div>
              <MetaPill className="self-start sm:self-auto">
                {featuredTools.length} featured
              </MetaPill>
            </div>

            <div className="space-y-6">
              {featuredTools.map((tool) => (
                <FeaturedToolCard key={tool.slug} tool={tool} />
              ))}
            </div>
          </div>
        )}

      {/* When "All" is selected, render sectioned groups */}
      {selectedCategory === "all" ? (
        <div className="space-y-12">
          {TOOL_CATEGORIES.map((cat) => {
            const catTools = tools.filter((t) => t.category === cat.id);
            if (catTools.length === 0) return null;

            return (
              <div key={cat.id} className="space-y-5">
                <div className="flex flex-col gap-1 border-b border-fd-border/70 pb-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-fd-foreground sm:text-2xl">
                      {cat.label}
                    </h3>
                    <p className="mt-0.5 text-sm text-fd-muted-foreground">
                      {cat.description}
                    </p>
                  </div>
                  <MetaPill className="self-start sm:self-auto">
                    {catTools.length} {catTools.length === 1 ? "item" : "items"}
                  </MetaPill>
                </div>

                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {catTools.map((tool) => (
                    <StandardToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* When a single category is selected */
        <div className="space-y-5">
          <div className="flex flex-col gap-1 border-b border-fd-border/70 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-fd-foreground sm:text-2xl">
                {TOOL_CATEGORIES.find((c) => c.id === selectedCategory)?.label}
              </h3>
              <p className="mt-0.5 text-sm text-fd-muted-foreground">
                {
                  TOOL_CATEGORIES.find((c) => c.id === selectedCategory)
                    ?.description
                }
              </p>
            </div>
            <MetaPill className="self-start sm:self-auto">
              {filteredTools.length}{" "}
              {filteredTools.length === 1 ? "item" : "items"}
            </MetaPill>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredTools.map((tool) => (
              <StandardToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
