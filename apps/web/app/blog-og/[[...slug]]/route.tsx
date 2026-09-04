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
import { blogSource, getVisiblePosts } from "@/lib/source";

export const dynamic = "force-static";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug?: string[] }> },
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
  const imageRoutes = await generateOgImageStaticParams(getVisiblePosts());
  return imageRoutes;
}
