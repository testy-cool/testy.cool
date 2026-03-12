import { description, title } from "@/app/layout.config";
import { blogConstants, getCategoryBySlug } from "@/blog-configuration";
import { getKnowledgeNotes } from "@/lib/source";

export const revalidate = false;
export const dynamic = "force-static";

const categorySlugs = [
  "tutorial",
  "troubleshooting",
  "lab-notes",
  "tools-tech",
  "tech",
  "conceptual",
  "solution",
] as const;

export function GET() {
  const siteUrl = `https://${blogConstants.siteName}`;
  const notes = getKnowledgeNotes();

  const lines = [
    title,
    "",
    description,
    "",
    "Resources",
    `- Blog: ${siteUrl}/blog`,
    `- Machine-readable index: ${siteUrl}/knowledge.json`,
    `- Search index: ${siteUrl}/api/search`,
    "",
    "How to use this site",
    "- Use the stable `id` field from /knowledge.json when referring to or revising a note.",
    "- Draft notes are excluded from public endpoints.",
    "- `status` tracks lifecycle. `resumeSignal` tracks whether a note should represent the author publicly.",
    "- `canonical` is the preferred public URL. `supersedes` lists older note ids this note replaces.",
    "",
    "Categories",
    ...categorySlugs.map((slug) => {
      const category = getCategoryBySlug(slug);
      return `- ${slug}: ${category.description}`;
    }),
    "",
    "Notes",
    ...notes.map(
      (note) =>
        `- ${note.id} | ${note.status} | ${note.category} | ${note.title} | ${note.absoluteUrl}`,
    ),
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
