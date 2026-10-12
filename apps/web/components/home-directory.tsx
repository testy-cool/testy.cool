"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Search } from "lucide-react";
import { Button } from "@repo/shadverse/components/button";
import { Input } from "@repo/shadverse/components/input";
import { Label } from "@repo/shadverse/components/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@repo/shadverse/components/toggle-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@repo/shadverse/components/select";
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
              className="grid grid-cols-1 items-start gap-x-8 gap-y-8 lg:grid-cols-2"
              aria-label={group.title}
            >
              {group.entries.map((entry) => (
                <div role="listitem" key={entry.href} className="min-w-0">
                  <Item
                    asChild
                    size="sm"
                    className="min-w-0 flex-col flex-nowrap items-start gap-4 border-0 p-0 pb-2 hover:bg-fd-muted focus-visible:ring-fd-primary"
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
  const categoryGroups = [
    { id: "tools", title: "Tools", groups: toolGroups },
    { id: "writing", title: "Writing", groups: postGroups },
  ].filter(({ id }) => scope === "all" || scope === id);
  const categorySelection =
    selection === "all" || selection === scope ? "all" : selection;

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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <ToggleGroup
            type="single"
            size="sm"
            value={scope}
            onValueChange={(value) => setSelection(value || scope)}
            aria-label="Filter by content type"
            aria-controls="home-results"
            className="w-full gap-1 rounded-lg bg-fd-muted/60 p-1 sm:w-fit"
          >
            {[
              { value: "all", label: "All work" },
              { value: "tools", label: "Tools" },
              { value: "writing", label: "Writing" },
            ].map(({ value, label }) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className="h-11 flex-1 rounded-md px-4 text-fd-muted-foreground data-[state=on]:bg-fd-background data-[state=on]:text-fd-foreground data-[state=on]:shadow-sm sm:flex-none"
              >
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className="relative w-full min-w-0 sm:max-w-xl sm:flex-1">
            <Label htmlFor="home-search" className="sr-only">
              Find a tool or post
            </Label>
            <Search
              className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-fd-muted-foreground"
              aria-hidden="true"
            />
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
              className="h-12 min-w-0 border-fd-border bg-fd-card ps-10 pe-20 text-base"
            />
            {query ? (
              <Button
                type="button"
                variant="ghost"
                onClick={clearSearch}
                className="absolute end-1 top-1/2 h-11 -translate-y-1/2"
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>
        <div className="md:hidden">
          <Select
            value={categorySelection}
            onValueChange={(value) =>
              setSelection(value === "all" ? scope : value)
            }
          >
            <SelectTrigger
              aria-label="Filter by category"
              className="h-11 w-full border-fd-border bg-fd-card text-base data-[size=default]:h-11"
            >
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent className="border-fd-border bg-fd-popover text-fd-popover-foreground">
              <SelectItem value="all" className="min-h-11 text-base">
                All categories
              </SelectItem>
              {categoryGroups.map(({ id, title, groups }) => (
                <SelectGroup key={id}>
                  <SelectLabel className="text-sm text-fd-muted-foreground">
                    {title}
                  </SelectLabel>
                  {groups.map((group) => (
                    <SelectItem
                      key={group.id}
                      value={group.id}
                      className="min-h-11 text-base"
                    >
                      {group.title}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="hidden min-w-0 flex-col gap-2 md:flex">
          {categoryGroups.map(({ id, title, groups }) => (
            <div key={id} className="flex min-w-0 items-start gap-3">
              <span
                id={`${id}-filter-label`}
                className="flex h-11 w-16 shrink-0 items-center text-sm font-medium text-fd-muted-foreground"
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
                className="min-w-0 flex-1 flex-wrap justify-start gap-2"
              >
                {groups.map((group) => (
                  <ToggleGroupItem
                    key={group.id}
                    value={group.id}
                    className="h-11 flex-none rounded-md border border-fd-border bg-fd-card px-3 text-fd-muted-foreground data-[state=on]:border-fd-foreground data-[state=on]:bg-fd-foreground data-[state=on]:text-fd-background"
                  >
                    {group.title}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          ))}
        </div>
        <div className="flex min-h-6 items-center justify-between gap-3">
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="text-sm text-fd-muted-foreground"
          >
            {query || selection !== "all"
              ? `${toolCount + postCount} of ${totalTools + totalPosts} entries`
              : `${totalTools + totalPosts} entries`}
          </p>
          {query || selection !== "all" ? (
            <Button
              type="button"
              variant="ghost"
              onClick={showEverything}
              className="h-11"
            >
              Reset filters
            </Button>
          ) : null}
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
