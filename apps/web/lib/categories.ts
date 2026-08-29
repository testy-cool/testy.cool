import { Brain, Book, Code, Cog, FlaskConical, Rocket, Wrench } from "lucide-react";

/**
 * Blog categories, keyed by the first path segment under content/blog.
 * Shared by the blog package configuration, the homepage and llms.txt.
 */
export const getCategoryBySlug = (slug: string) => {
  const categories = {
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
