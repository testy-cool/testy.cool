"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Badge } from "@repo/shadverse/components/badge";
import { Button } from "@repo/shadverse/components/button";
import { Input } from "@repo/shadverse/components/input";
import { Label } from "@repo/shadverse/components/label";
import { Separator } from "@repo/shadverse/components/separator";
import { cn } from "@repo/shadverse/lib/utils";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
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
        <div className="flex items-center gap-3">
          <h2
            id={`${id}-heading`}
            className="text-xl font-semibold tracking-tight"
          >
            {title}
          </h2>
          <Badge
            variant="secondary"
            aria-label={`${countEntries(groups)} entries`}
          >
            {countEntries(groups)}
          </Badge>
        </div>
        <Button asChild variant="link" size="sm">
          <Link href={href}>
            {linkLabel} <ArrowRight data-icon="inline-end" aria-hidden="true" />
          </Link>
        </Button>
      </div>
      <Separator className="my-5" />
      <div className="flex flex-col gap-6">
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
                className="text-base font-semibold text-fd-foreground"
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
              <span className="text-sm text-fd-muted-foreground">
                {group.entries.length}
              </span>
            </div>
            <ItemGroup className="-mx-4" aria-label={group.title}>
              {group.entries.map((entry) => (
                <div role="listitem" key={entry.href}>
                  <Item
                    asChild
                    size="sm"
                    className="min-w-0 hover:bg-fd-muted focus-visible:ring-fd-primary"
                  >
                    <Link href={entry.href}>
                      <ItemContent className="min-w-0">
                        <ItemTitle className="text-base text-fd-foreground">
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

  function clearSearch() {
    setQuery("");
    inputRef.current?.focus();
  }

  function jumpTo(id: string) {
    setQuery("");
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
          <p
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="text-sm text-fd-muted-foreground"
          >
            {toolCount}{" "}
            {toolCount === 1 ? "tool or extension" : "tools and extensions"} ·{" "}
            {postCount} {postCount === 1 ? "post" : "posts"}
          </p>
        </div>
        <nav
          aria-label="Explore the site"
          className="-mx-3 flex flex-wrap gap-1"
        >
          <Button asChild variant="ghost" size="sm">
            <a href="#tools" onClick={() => jumpTo("tools")}>
              Tools & extensions
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a href="#writing" onClick={() => jumpTo("writing")}>
              Writing
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/stack">Stack</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/about">About</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/changelog">Changelog</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <a
              href="https://ailookup.dev"
              target="_blank"
              rel="noopener noreferrer"
            >
              AI tools directory{" "}
              <ExternalLink data-icon="inline-end" aria-hidden="true" />
            </a>
          </Button>
        </nav>
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
            "grid items-start gap-10 lg:gap-16",
            toolCount > 0 && postCount > 0 && "md:grid-cols-2",
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
