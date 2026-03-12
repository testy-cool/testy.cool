import { blogSource, getBlogPosts } from "@/lib/source";
import {
  BlogWrapper,
  generateBlogMetadata,
  generateBlogStaticParams,
} from "@repo/fumadocs-blog/blog";
import {
  createBlogMetadata,
  blogConstants,
  getBlogConfiguration,
} from "@/blog-configuration";
import { getCategoryBySlug } from "@/blog-configuration";
import { getSeriesBySlug } from "@/blog-configuration";
import { getMDXComponents } from "@/mdx-components";
import { blogPostingSchema, breadcrumbSchema } from "@/lib/jsonld";
import type { Metadata } from "next";

const siteUrl = `https://${blogConstants.siteName}`;

function getJsonLd(page: any, category?: string) {
  const postUrl = `${siteUrl}${page.url}`;
  const imageUrl = page.data.image
    ? `${siteUrl}${page.data.image}`
    : `${siteUrl}${page.url.replace("/blog/", "/blog-og/")}/image.png`;

  const categoryInfo = category ? getCategoryBySlug(category) : null;

  const breadcrumbItems = [
    { name: "Home", url: siteUrl },
    { name: "Blog", url: `${siteUrl}/blog` },
    ...(categoryInfo && category
      ? [{ name: categoryInfo.label, url: `${siteUrl}/blog/${category}` }]
      : []),
    { name: page.data.title, url: postUrl },
  ];

  return [
    blogPostingSchema({
      title: page.data.title,
      description: page.data.description,
      date: page.data.date,
      author: page.data.author || blogConstants.defaultAuthorName,
      url: postUrl,
      image: imageUrl,
    }),
    breadcrumbSchema(breadcrumbItems),
  ];
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const posts = getBlogPosts();

  return (
    <BlogWrapper
      params={params}
      blogSource={blogSource}
      posts={posts}
      getCategoryBySlug={getCategoryBySlug}
      getSeriesBySlug={getSeriesBySlug}
      mdxComponents={getMDXComponents()}
      configuration={getBlogConfiguration()}
      includeDrafts={process.env.NODE_ENV !== "production"}
      getJsonLd={getJsonLd}
    />
  );
}

export async function generateStaticParams() {
  const posts = getBlogPosts();
  return generateBlogStaticParams(blogSource, posts);
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const params = await props.params;

  return generateBlogMetadata({
    params,
    createBlogMetadata,
    blogConstants,
    blogSource,
    getCategoryBySlug,
    getSeriesBySlug,
  });
}
