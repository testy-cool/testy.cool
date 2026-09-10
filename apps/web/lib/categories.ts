import {
  Brain,
  Book,
  Code,
  Cog,
  FlaskConical,
  Pencil,
  Rocket,
  TestTube,
  Wrench,
} from "lucide-react";

/**
 * Blog categories, keyed by the first path segment under content/blog.
 * Shared by the blog package configuration, the homepage and llms.txt.
 */
export const getCategoryBySlug = (slug: string) => {
  const categories = {
    drafts: {
      label: "Drafts",
      icon: Pencil,
      description: "Unfinished. Visible in dev only, never built into the site.",
    },
    tutorial: {
      label: "Tutorials",
      icon: Book,
      description: "Longer posts that build something up from zero.",
    },
    troubleshooting: {
      label: "Troubleshooting",
      icon: Wrench,
      description: "Notes on specific problems and the fixes that worked.",
    },
    "lab-notes": {
      label: "Lab Notes",
      icon: FlaskConical,
      description:
        "Short notes on what I tried, what happened, and what seems true so far.",
    },
    "tools-tech": {
      label: "Tools & Tech",
      icon: Cog,
      description:
        "Tooling notes, implementation details, and small experiments.",
    },
    conceptual: {
      label: "Concepts",
      icon: Brain,
      description: "Posts that are more about framing than implementation.",
    },
    solution: {
      label: "Solutions",
      icon: Rocket,
      description: "Problem-and-solution writeups.",
    },
    tried: {
      label: "Tried",
      icon: TestTube,
      description:
        "Things I tried, what happened, and whether I kept them.",
    },
    tech: {
      label: "Tech Notes",
      icon: Code,
      description: "General engineering notes and implementation details.",
    },
  };

  const fallbackLabel = slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  return (
    categories[slug as keyof typeof categories] || {
      label: fallbackLabel,
      icon: Book,
      description: `Posts in ${fallbackLabel}.`,
    }
  );
};

/**
 * Label for the `kind` frontmatter field on a Tried note. The list is open,
 * so anything unmapped falls back to capitalised words.
 */
export const getKindLabel = (kind: string) => {
  const labels: Record<string, string> = {
    library: "Library",
    "agent-skill": "Agent skill",
    cli: "CLI",
    service: "Service",
    "mcp-server": "MCP server",
  };

  return (
    labels[kind] ??
    kind
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ")
  );
};

export const getSeriesBySlug = (slug: string) => {
  // No series exist yet. Add them here keyed by slug when a post sets `series`.
  const series: Record<
    string,
    { label: string; icon: typeof Book; description: string }
  > = {};

  return (
    series[slug] || {
      label: slug.charAt(0).toUpperCase() + slug.slice(1),
      icon: Book,
      description: `Articles in the ${slug.charAt(0).toUpperCase() + slug.slice(1)} series.`,
    }
  );
};
