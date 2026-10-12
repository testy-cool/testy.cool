"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@repo/shadverse/components/button";
import { Input } from "@repo/shadverse/components/input";
import { Label } from "@repo/shadverse/components/label";
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
      <div className="mt-6 flex flex-col gap-4">
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
            <ItemGroup className="-mx-2 gap-1" aria-label={group.title}>
              {group.entries.map((entry) => (
                <div role="listitem" key={entry.href}>
                  <Item
                    asChild
                    size="sm"
                    className="min-w-0 flex-col flex-nowrap items-start gap-4 p-2 hover:bg-fd-muted focus-visible:ring-fd-primary sm:flex-row sm:items-center"
                  >
                    <Link href={entry.href}>
                      {entry.preview ? (
                        <ItemMedia
                          variant="image"
                          className="aspect-[8/5] h-auto w-full rounded-md border border-fd-border bg-fd-muted sm:h-[120px] sm:w-48"
                        >
                          <Image
                            src={entry.preview}
                            alt=""
                            width={400}
                            height={250}
                            className="object-cover object-top"
                          />
                        </ItemMedia>
                      ) : null}
                      <ItemContent className="w-full min-w-0">
                        <ItemTitle className="w-full text-base font-semibold text-fd-foreground sm:block sm:truncate">
                          {entry.title}
                        </ItemTitle>
                        {entry.description ? (
                          <ItemDescription className="line-clamp-1 text-wrap text-fd-muted-foreground">
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
            {query
              ? `${toolCount + postCount} of ${totalTools + totalPosts} entries`
              : `${totalTools + totalPosts} entries`}
          </p>
        </div>
        <nav
          aria-label="Explore the site"
          className="-mx-3 flex flex-col gap-1"
        >
          {[
            { id: "tools", title: "Tools", groups: toolGroups },
            { id: "writing", title: "Writing", groups: postGroups },
          ].map(({ id, title, groups }) => (
            <div key={id} className="flex min-w-0 items-start gap-1">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="w-20 shrink-0 justify-start font-semibold"
              >
                <a href={`#${id}`} onClick={() => jumpTo(id)}>
                  {title}
                </a>
              </Button>
              <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto pb-1">
                {groups.map((group) => (
                  <Button
                    asChild
                    key={group.id}
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-fd-muted-foreground"
                  >
                    <a href={`#${group.id}`} onClick={() => jumpTo(group.id)}>
                      {group.title}
                    </a>
                  </Button>
                ))}
                {id === "writing" ? (
                  <>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                    >
                      <Link href="/changelog">Changelog</Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                    >
                      <a
                        href="https://ailookup.dev"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        AI tools directory
                        <ExternalLink
                          data-icon="inline-end"
                          aria-hidden="true"
                        />
                      </a>
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
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
  );
}
