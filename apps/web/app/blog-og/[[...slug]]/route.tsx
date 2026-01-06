import { generateOGImage } from "@/components/og-image";
import {
  generateOgImageStaticParams,
  generateOGImageMetadata,
} from "@repo/fumadocs-blog/blog";
import {
  blogConstants,
  getCategoryBySlug,
  getSeriesBySlug,
} from "@/blog-configuration";
import { blogSource, getBlogPosts } from "@/lib/source";

export const contentType = "image/png";
export const dynamic = "force-static";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const resolvedParams = await params;

  const metadata = generateOGImageMetadata(resolvedParams, {
    blogConstants,
    getCategoryBySlug,
    getSeriesBySlug,
    blogSource,
  });

  return generateOGImage(metadata.title);
}

export async function generateStaticParams() {
  const posts = getBlogPosts();
  const imageRoutes = await generateOgImageStaticParams(blogSource, posts);
  return imageRoutes;
}
