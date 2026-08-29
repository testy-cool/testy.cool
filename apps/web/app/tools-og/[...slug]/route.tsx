import { generateOGImage } from "@/components/og-image";
import { allTools } from "@/lib/tools";

export const dynamic = "force-static";

const INDEX_SLUG = "index";

/** Tools with their own page. Tutorial-backed tools already get a blog-og image. */
const standaloneTools = allTools.filter((tool) => !tool.blogPath);

function titleFor(slug: string): string | null {
  if (slug === INDEX_SLUG) return "Tools";
  return standaloneTools.find((tool) => tool.slug === slug)?.title ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string[] }> },
) {
  const { slug } = await params;
  const title = titleFor(slug[0] ?? "");
  if (!title) return new Response("Not found", { status: 404 });
  return generateOGImage(title);
}

export function generateStaticParams() {
  return [
    { slug: [INDEX_SLUG, "image.png"] },
    ...standaloneTools.map((tool) => ({ slug: [tool.slug, "image.png"] })),
  ];
}
