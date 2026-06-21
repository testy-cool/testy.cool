import { blog } from "@/.source";
import { loader } from "fumadocs-core/source";
import { createMDXSource } from "fumadocs-mdx";
import type { PageTree } from "fumadocs-core/server";

export const blogSource = loader({
  baseUrl: "/blog",
  source: createMDXSource(blog),
});

export const getBlogPost = blogSource.getPage;
export const getBlogPosts = blogSource.getPages;
export const pageBlogTree: PageTree.Root = blogSource.pageTree;

export type BlogPost = ReturnType<typeof getBlogPost>;

export type ResumeSignal = "featured" | "supporting" | "none";

export interface ResumeNote {
  id: string;
  title: string;
  description?: string;
  category: string;
  date: string;
  updated?: string;
  tags: string[];
  url: string;
  resumeSignal: ResumeSignal;
}

function normalizeResumeSignal(signal: unknown): ResumeSignal {
  if (signal === "featured" || signal === "supporting") return signal;
  return "none";
}

function dateToIso(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return new Date(value).toISOString();
  return undefined;
}

export function getKnowledgeNotes() {
  const siteUrl = `https://testy.cool`;
  const posts = getBlogPosts()
    .filter((p) => p != null)
    .sort((a, b) => b.data.date.getTime() - a.data.date.getTime());

  return posts.map((post) => ({
    id: post.slugs.join("/"),
    title: post.data.title,
    description: post.data.description ?? "",
    category: post.slugs[0] ?? "uncategorized",
    status: "published" as const,
    date: post.data.date.toISOString(),
    tags: post.data.tags ?? [],
    url: post.url,
    absoluteUrl: `${siteUrl}${post.url}`,
    canonical: `${siteUrl}${post.url}`,
  }));
}

export function getResumeNotes(): ResumeNote[] {
  return getBlogPosts()
    .filter((post): post is NonNullable<BlogPost> => post != null)
    .map((post) => {
      const data = post.data as typeof post.data & {
        resumeSignal?: ResumeSignal;
        updated?: string | Date;
      };

      return {
        id: post.slugs.join("/"),
        title: data.title,
        description: data.description,
        category: post.slugs[0] ?? "uncategorized",
        date: data.date.toISOString(),
        updated: dateToIso(data.updated),
        tags: data.tags ?? [],
        url: post.url,
        resumeSignal: normalizeResumeSignal(data.resumeSignal),
      };
    })
    .filter((note) => note.resumeSignal !== "none");
}
