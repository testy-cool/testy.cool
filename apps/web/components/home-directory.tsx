"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@repo/shadverse/components/button";
import { Input } from "@repo/shadverse/components/input";
import { Label } from "@repo/shadverse/components/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@repo/shadverse/components/toggle-group";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@repo/shadverse/components/item";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@repo/shadverse/components/empty";

interface DirectoryEntry {
  title: string;
  description?: string;
  href: string;
  preview?: string;
  keywords: string[];
}

interface DirectoryGroup {
  id: string;
  title: string;
  href?: string;
  entries: DirectoryEntry[];
}

interface HomeDirectoryProps {
  toolGroups: DirectoryGroup[];
  postGroups: DirectoryGroup[];
}

function filterGroups(
  groups: DirectoryGroup[],
  terms: string[],
  selection: string,
  section: "tools" | "writing",
) {
  return groups
    .filter(
      (group) =>
        selection === "all" || selection === section || selection === group.id,
    )
    .map((group) => ({
      ...group,
      entries: group.entries.filter((entry) => {
        const searchable = [
          group.title,
          entry.title,
          entry.description,
          ...entry.keywords,
        ]
          .join(" ")
          .toLowerCase();
        return terms.every((term) => searchable.includes(term));
      }),
    }))
    .filter((group) => group.entries.length > 0);
}

function countEntries(groups: DirectoryGroup[]) {
  return groups.reduce((total, group) => total + group.entries.length, 0);
}

function DirectorySection({
  id,
  title,
  href,
  linkLabel,
  groups,
}: {
  id: string;
  title: string;
  href: string;
  linkLabel: string;
  groups: DirectoryGroup[];
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="min-w-0 scroll-mt-24"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id={`${id}-heading`}
          className="text-2xl font-semibold tracking-tight"
        >
          {title}
        </h2>
        <Button asChild variant="link" size="sm">
          <Link href={href}>
            {linkLabel} <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <div className="mt-6 flex flex-col gap-8">
        {groups.map((group) => (
          <section
            key={group.id}
            id={group.id}
            aria-labelledby={`${group.id}-heading`}
            className="scroll-mt-24"
          >
            <div className="mb-2 flex items-center gap-2">
              <h3
                id={`${group.id}-heading`}
                className="text-sm font-medium uppercase tracking-wide text-fd-muted-foreground"
              >
                {group.href ? (
                  <Link
                    href={group.href}
                    className="rounded-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary"
                  >
                    {group.title}
                  </Link>
                ) : (
                  group.title
                )}
              </h3>
              <span className="text-sm tabular-nums text-fd-muted-foreground">
                {group.entries.length}
              </span>
            </div>
            <ItemGroup
              className="-mx-2 grid grid-cols-1 items-start gap-x-6 gap-y-8 lg:grid-cols-2"
              aria-label={group.title}
            >
              {group.entries.map((entry) => (
                <div role="listitem" key={entry.href} className="min-w-0">
                  <Item
                    asChild
                    size="sm"
                    className="min-w-0 flex-col flex-nowrap items-start gap-4 p-2 hover:bg-fd-muted focus-visible:ring-fd-primary"
                  >
                    <Link href={entry.href}>
                      {entry.preview ? (
                        <ItemMedia
                          variant="image"
                          className="aspect-[8/5] h-auto w-full rounded-md border border-fd-border bg-fd-muted"
                        >
                          <Image
                            src={entry.preview}
                            alt=""
                            width={800}
                            height={500}
                            className="object-cover object-top"
                          />
                        </ItemMedia>
                      ) : null}
                      <ItemContent className="w-full min-w-0">
                        <ItemTitle className="w-full text-xl font-semibold leading-7 text-fd-foreground">
                          {entry.title}
                        </ItemTitle>
                        {entry.description ? (
                          <ItemDescription className="line-clamp-3 text-wrap text-base leading-6 text-fd-muted-foreground">
                            {entry.description}
                          </ItemDescription>
                        ) : null}
                      </ItemContent>
                    </Link>
                  </Item>
                </div>
              ))}
            </ItemGroup>
          </section>
        ))}
      </div>
    </section>
  );
}

export function HomeDirectory({ toolGroups, postGroups }: HomeDirectoryProps) {
  const [query, setQuery] = useState("");
  const [selection, setSelection] = useState("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const tools = filterGroups(toolGroups, terms, selection, "tools");
  const posts = filterGroups(postGroups, terms, selection, "writing");
  const toolCount = countEntries(tools);
  const postCount = countEntries(posts);
  const totalTools = countEntries(toolGroups);
  const totalPosts = countEntries(postGroups);
  const scope =
    selection === "all"
      ? "all"
      : selection === "tools" ||
          toolGroups.some((group) => group.id === selection)
        ? "tools"
        : "writing";

  function clearSearch() {
    setQuery("");
    inputRef.current?.focus();
  }

  function showEverything() {
    setQuery("");
    setSelection("all");
    inputRef.current?.focus();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 max-w-xl flex-1 items-center gap-2">
            <Label htmlFor="home-search" className="sr-only">
              Find a tool or post
            </Label>
            <Input
              id="home-search"
              ref={inputRef}
              type="search"
              autoComplete="off"
              placeholder="Find a tool or post..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Escape") setQuery("");
              }}
              className="h-10 min-w-0 max-w-xl"
            />
            {query ? (
              <Button type="button" variant="ghost" onClick={clearSearch}>
                Clear
              </Button>
            ) : null}
          </div>
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="shrink-0 text-sm text-fd-muted-foreground"
          >
            {query || selection !== "all"
              ? `${toolCount + postCount} of ${totalTools + totalPosts} entries`
              : `${totalTools + totalPosts} entries`}
          </p>
        </div>
        <ToggleGroup
          type="single"
          size="sm"
          value={scope}
          onValueChange={(value) => setSelection(value || "all")}
          aria-label="Filter by content type"
          aria-controls="home-results"
          className="gap-1"
        >
          {[
            { value: "all", label: "All work" },
            { value: "tools", label: "Tools" },
            { value: "writing", label: "Writing" },
          ].map(({ value, label }) => (
            <ToggleGroupItem
              key={value}
              value={value}
              className="flex-none rounded-md px-3 data-[state=on]:bg-fd-muted data-[state=on]:text-fd-foreground"
            >
              {label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex min-w-0 flex-col gap-1">
          {[
            { id: "tools", title: "Tools", groups: toolGroups },
            { id: "writing", title: "Writing", groups: postGroups },
          ]
            .filter(({ id }) => scope === "all" || scope === id)
            .map(({ id, title, groups }) => (
              <div key={id} className="flex min-w-0 items-start gap-1">
                <span
                  id={`${id}-filter-label`}
                  className="flex h-10 w-20 shrink-0 items-center text-sm font-medium text-fd-muted-foreground"
                >
                  {title}
                </span>
                <ToggleGroup
                  type="single"
                  size="sm"
                  value={selection}
                  onValueChange={(value) => setSelection(value || id)}
                  aria-labelledby={`${id}-filter-label`}
                  aria-controls="home-results"
                  className="min-w-0 flex-1 justify-start gap-1 overflow-x-auto p-1"
                >
                  {groups.map((group) => (
                    <ToggleGroupItem
                      key={group.id}
                      value={group.id}
                      className="flex-none rounded-md px-3 text-fd-muted-foreground data-[state=on]:bg-fd-muted data-[state=on]:text-fd-foreground"
                    >
                      {group.title}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            ))}
        </div>
      </div>
      <div id="home-results">
        {toolCount + postCount === 0 ? (
          <Empty>
            <EmptyHeader className="min-w-0 max-w-full">
              <EmptyTitle>No matching tools or posts</EmptyTitle>
              <EmptyDescription>
                Try a topic like agents, CSS or Chrome.
              </EmptyDescription>
            </EmptyHeader>
            <Button type="button" variant="outline" onClick={showEverything}>
              Show everything
            </Button>
          </Empty>
        ) : (
          <div className="flex min-w-0 flex-col gap-10">
            {toolCount > 0 ? (
              <DirectorySection
                id="tools"
                title="Tools & extensions"
                href="/tools"
                linkLabel="All tools"
                groups={tools}
              />
            ) : null}
            {postCount > 0 ? (
              <DirectorySection
                id="writing"
                title="Writing"
                href="/blog"
                linkLabel="All posts"
                groups={posts}
              />
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
