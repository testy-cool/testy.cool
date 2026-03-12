import { description, title } from "@/app/layout.config";
import { blogConstants } from "@/blog-configuration";
import { getKnowledgeNotes } from "@/lib/source";

export const revalidate = false;
export const dynamic = "force-static";

export function GET() {
  const siteUrl = `https://${blogConstants.siteName}`;
  const notes = getKnowledgeNotes();

  return Response.json({
    site: {
      name: blogConstants.siteName,
      title,
      description,
      url: siteUrl,
      resources: {
        blog: `${siteUrl}/blog`,
        llms: `${siteUrl}/llms.txt`,
        search: `${siteUrl}/api/search`,
      },
    },
    generatedAt: new Date().toISOString(),
    noteCount: notes.length,
    notes,
  });
}
