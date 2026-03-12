import { blog } from "@/.source";
import { loader } from "fumadocs-core/source";
import { createMDXSource } from "fumadocs-mdx";
import type { InferMetaType, InferPageType } from "fumadocs-core/source";
import type { PageTree } from "fumadocs-core/server";

export const blogSource = loader({
  baseUrl: "/blog",
  source: createMDXSource(blog),
});

export const {
  getPage: getBlogPost,
  getPages: getBlogPosts,
  pageTree: pageBlogTree,
} = blogSource;

export type BlogPost = ReturnType<typeof getBlogPost>;

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
