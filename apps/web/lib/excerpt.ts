import fs from "node:fs";
import path from "node:path";

/**
 * A homepage excerpt is the post's own opening paragraph, not the frontmatter
 * hook. The hook sells the post in metadata; the opening paragraph shows what
 * the writing actually reads like. Falls back to the frontmatter description
 * when no readable paragraph is available.
 */

const CONTENT_ROOTS = [
  path.join(process.cwd(), "content", "blog"),
  path.join(process.cwd(), "apps", "web", "content", "blog"),
];

const MAX_EXCERPT_CHARS = 280;

const excerptCache = new Map<string, string | undefined>();

function resolvePostFile(slugs: string[] | undefined): string | null {
  if (!slugs || slugs.length === 0) return null;
  for (const root of CONTENT_ROOTS) {
    for (const ext of [".mdx", ".md"]) {
      const direct = path.join(root, ...slugs) + ext;
      if (fs.existsSync(direct)) return direct;
      const index = path.join(root, ...slugs, `index${ext}`);
      if (fs.existsSync(index)) return index;
    }
  }
  return null;
}

function stripFrontmatter(source: string): string {
  const match = source.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? source.slice(match[0].length) : source;
}

/** Collapse MDX to paragraph lines: no frontmatter, code, JSX blocks or lists. */
function toParagraphLines(source: string): string[] {
  const lines = stripFrontmatter(source).split(/\r?\n/);
  const kept: string[] = [];
  let inFence = false;
  let skipUntil: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (skipUntil) {
      if (trimmed.includes(skipUntil)) skipUntil = null;
      continue;
    }
    if (!trimmed) {
      kept.push("");
      continue;
    }
    if (/^(import|export)\s/.test(trimmed)) continue;
    if (trimmed.startsWith("<!--")) continue;
    if (/\/>$/.test(trimmed)) continue;
    const componentOpen = trimmed.match(/^<([A-Z][A-Za-z0-9]*)\b[^<>]*[^/]>$/);
    if (componentOpen?.[1]) {
      skipUntil = `</${componentOpen[1]}`;
      continue;
    }
    if (trimmed.startsWith("<")) continue;
    if (/^#{1,6}\s/.test(trimmed)) continue;
    if (/^[-*+]\s/.test(trimmed)) continue;
    if (/^\d+\.\s/.test(trimmed)) continue;
    if (/^>\s?/.test(trimmed)) continue;
    if (/^\|/.test(trimmed)) continue;
    kept.push(trimmed);
  }
  return kept;
}

function toPlainText(paragraph: string): string {
  return (
    paragraph
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      // Fumadocs inline annotations such as `npx mdtask`{:mdtask}.
      .replace(/\{:[^}]*\}/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function truncateAtWord(text: string, limit: number): string {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(" ");
  return `${cut.slice(0, lastSpace > 60 ? lastSpace : limit).trimEnd()}…`;
}

function firstParagraph(source: string): string | undefined {
  const lines = toParagraphLines(source);
  // Wrapped lines inside a paragraph separate on one newline, paragraphs on a
  // blank line.
  const paragraphs = lines.join("\n").split(/\n{2,}/);
  for (const candidate of paragraphs) {
    const text = toPlainText(candidate.replace(/\n/g, " "));
    if (text.split(" ").length >= 6)
      return truncateAtWord(text, MAX_EXCERPT_CHARS);
  }
  return undefined;
}

/** Opening paragraph of the post file, or undefined when there is none. */
export function getPostExcerpt(post: { slugs?: string[] }): string | undefined {
  const key = (post.slugs ?? []).join("/");
  if (excerptCache.has(key)) return excerptCache.get(key);

  const file = resolvePostFile(post.slugs);
  let excerpt: string | undefined;
  if (file) {
    try {
      excerpt = firstParagraph(fs.readFileSync(file, "utf8"));
    } catch {
      excerpt = undefined;
    }
  }
  excerptCache.set(key, excerpt);
  return excerpt;
}
