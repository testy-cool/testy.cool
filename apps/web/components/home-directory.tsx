"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Button } from "@repo/shadverse/components/button";
import { Input } from "@repo/shadverse/components/input";
import { Label } from "@repo/shadverse/components/label";
import { cn } from "@repo/shadverse/lib/utils";
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

function filterGroups(groups: DirectoryGroup[], terms: string[]) {
  return groups
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
              <span className="text-xs tabular-nums text-fd-muted-foreground">
                {group.entries.length}
              </span>
            </div>
            <ItemGroup className="-mx-2 gap-1" aria-label={group.title}>
              {group.entries.map((entry) => (
                <div role="listitem" key={entry.href}>
                  <Item
                    asChild
                    size="sm"
                    className="min-w-0 flex-nowrap items-start gap-3 p-2 hover:bg-fd-muted focus-visible:ring-fd-primary"
                  >
                    <Link href={entry.href}>
                      {entry.preview ? (
                        <ItemMedia
                          variant="image"
                          className="h-[45px] w-[72px] rounded-md border border-fd-border bg-fd-muted sm:h-[70px] sm:w-28"
                        >
                          <Image
                            src={entry.preview}
                            alt=""
                            width={256}
                            height={160}
                            className="object-cover object-top"
                          />
                        </ItemMedia>
                      ) : null}
                      <ItemContent className="min-w-0">
                        <ItemTitle className="text-base font-semibold text-fd-foreground">
                          {entry.title}
                        </ItemTitle>
                        {entry.description ? (
                          <ItemDescription className="text-fd-muted-foreground">
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
  const inputRef = useRef<HTMLInputElement>(null);
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const tools = filterGroups(toolGroups, terms);
  const posts = filterGroups(postGroups, terms);
  const toolCount = countEntries(tools);
  const postCount = countEntries(posts);
  const totalTools = countEntries(toolGroups);
  const totalPosts = countEntries(postGroups);

  function clearSearch() {
    setQuery("");
    inputRef.current?.focus();
  }

  function jumpTo(id: string) {
    setQuery("");
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 items-center gap-2">
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
              className="h-10 max-w-xl"
            />
            {query ? (
              <Button type="button" variant="ghost" onClick={clearSearch}>
                Clear
              </Button>
            ) : null}
          </div>
          <nav
            aria-label="Explore the site"
            className="flex shrink-0 flex-wrap gap-2"
          >
            <Button asChild variant="outline" size="sm">
              <a href="#tools" onClick={() => jumpTo("tools")}>
                Tools & extensions
                <span className="tabular-nums text-fd-muted-foreground">
                  {totalTools}
                </span>
              </a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="#writing" onClick={() => jumpTo("writing")}>
                Writing
                <span className="tabular-nums text-fd-muted-foreground">
                  {totalPosts}
                </span>
              </a>
            </Button>
          </nav>
        </div>
        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className={cn(
            "text-sm text-fd-muted-foreground",
            !query && "sr-only",
          )}
        >
          {query
            ? `${toolCount + postCount} of ${totalTools + totalPosts} entries match`
            : ""}
        </p>
      </div>
      {toolCount + postCount === 0 ? (
        <Empty>
          <EmptyHeader className="min-w-0 max-w-full">
            <EmptyTitle>No matching tools or posts</EmptyTitle>
            <EmptyDescription>
              Try a topic like agents, CSS or Chrome.
            </EmptyDescription>
          </EmptyHeader>
          <Button type="button" variant="outline" onClick={clearSearch}>
            Show everything
          </Button>
        </Empty>
      ) : (
        <div
          className={cn(
            "grid items-start gap-10 lg:gap-12",
            toolCount > 0 && postCount > 0 && "lg:grid-cols-2",
          )}
        >
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
  );
}
