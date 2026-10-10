export type ToolType = "Tool" | "Tutorial" | "Extension";
export type ToolCategory =
  | "ai-prompting"
  | "text-nlp"
  | "extensions"
  | "tutorials"
  | "directories";

export interface Tool {
  slug: string;
  title: string;
  description: string;
  screenshot?: string;
  tags?: string[];
  /** If tool is embedded in a blog post, link there instead of /tools/[slug] */
  blogPath?: string;
  /** Display type: "Tool", "Tutorial", "Extension" */
  type: ToolType;
  category: ToolCategory;
  categoryLabel: string;
  badge?: string;
  featured?: boolean;
  highlights?: string[];
}

export const TOOL_CATEGORIES: {
  id: ToolCategory;
  label: string;
  description: string;
}[] = [
  {
    id: "ai-prompting",
    label: "AI & Prompting",
    description:
      "Interactive workbenches for model pricing, prompt engineering, and video analysis.",
  },
  {
    id: "text-nlp",
    label: "Text & Linguistics",
    description:
      "Utilities for n-gram frequency distributions, phrase frames, and vocabulary extraction.",
  },
  {
    id: "extensions",
    label: "Browser Extensions",
    description:
      "Lightweight Manifest V3 extensions for GitHub repo health overlays, sidebar AI automation, and productivity.",
  },
  {
    id: "tutorials",
    label: "Interactive Tutorials",
    description:
      "Deep-dive technical guides paired with custom interactive calculators built from zero.",
  },
  {
    id: "directories",
    label: "Directories",
    description:
      "Searchable lists kept up to date from official sources, every day.",
  },
];

export const allTools: Tool[] = [
  {
    slug: "llm-price-calculator",
    title: "LLM Price Calculator",
    description:
      "Real-time cost calculator comparing 200+ models across Anthropic, OpenAI, Google, DeepSeek, and xAI. Calculate per-call costs, budget ceilings, and multi-turn chains with prompt caching.",
    screenshot: "/images/tools/llm-price-calculator.webp",
    tags: ["LLM", "OpenRouter", "Pricing", "Prompt Caching"],
    type: "Tool",
    category: "ai-prompting",
    categoryLabel: "AI & Prompting",
    badge: "Live OpenRouter Sync",
    featured: true,
    highlights: [
      "Live prices across 200+ models from OpenRouter API",
      "Prompt caching simulator (75-90% discount calculation)",
      "Multi-turn conversational context accumulator",
      "Zero backend required - all settings saved in URL",
    ],
  },
  {
    slug: "prompt-field-notes",
    title: "Prompt Field Notes",
    description:
      "Context-specific prompting observations and failure modes that held up across production workloads. Copy directly as Markdown or structured XML.",
    screenshot: "/images/tools/prompt-field-notes.webp",
    tags: ["LLM", "Prompting", "Agents"],
    type: "Tool",
    category: "ai-prompting",
    categoryLabel: "AI & Prompting",
    badge: "Production Patterns",
    featured: true,
    highlights: [
      "Field-tested prompt patterns with clear rationale",
      "Instant 1-click export to Markdown or structured XML",
      "Documented edge cases and when NOT to apply each rule",
    ],
  },
  {
    slug: "video-breakdown",
    title: "Video Breakdown",
    description:
      "Paste a YouTube URL. AI watches the video and writes a scroll-synced text breakdown with clickable chapter timestamps.",
    screenshot: "/images/tools/video-breakdown.webp",
    tags: ["YouTube", "AI", "Gemini"],
    type: "Tool",
    category: "ai-prompting",
    categoryLabel: "AI & Prompting",
    badge: "Multimodal Video",
  },
  {
    slug: "ngram-viewer",
    title: "N-gram Viewer & Phrase Frames",
    description:
      "Paste text to extract n-gram frequencies plus phrase frames - n-grams with one variable slot so variants collapse into one entry.",
    screenshot: "/images/tools/ngram-viewer.webp",
    tags: ["Text", "Linguistics", "NLP"],
    type: "Tool",
    category: "text-nlp",
    categoryLabel: "Text & Linguistics",
    badge: "Client-Side NLP",
  },
  {
    slug: "channel-pantry",
    title: "Channel Pantry",
    description:
      "Analyze a YouTube cooking channel to discover which ingredients and flavor pairings they rely on most.",
    screenshot: "/images/tools/channel-pantry.webp",
    tags: ["YouTube", "AI", "Cooking"],
    type: "Tool",
    category: "text-nlp",
    categoryLabel: "Text & Linguistics",
    badge: "Data Extraction",
  },
  {
    slug: "repoaura",
    title: "RepoAura",
    description:
      "Chrome extension that adds GitHub repository health context and signal overlays beside repository links.",
    screenshot: "/images/tools/repoaura.webp",
    tags: ["Chrome", "GitHub", "Extension", "WXT"],
    type: "Extension",
    category: "extensions",
    categoryLabel: "Browser Extensions",
    badge: "Manifest V3",
  },
  {
    slug: "sitegeist-fork",
    title: "Sitegeist (Fork)",
    description:
      "Maintained fork of Mario Zechner's (badlogic) AI browser sidebar. Automate repetitive tasks, extract data, and execute workflows with modern pi-agent-core.",
    screenshot: "/images/tools/sitegeist.webp",
    tags: ["Fork", "Chrome", "AI", "Browser Automation", "Extension"],
    type: "Extension",
    category: "extensions",
    categoryLabel: "Browser Extensions",
    badge: "Fork",
  },
  {
    slug: "chatgpt-conversation-exporter",
    title: "ChatGPT Conversation Exporter",
    description:
      "Browser extension for exporting individual ChatGPT threads to clean Markdown or standalone HTML files.",
    screenshot:
      "/images/tools/chatgpt-conversation-exporter/export-chatgpt-conversation-markdown-html.webp",
    tags: ["Chrome", "Export", "Markdown"],
    type: "Extension",
    category: "extensions",
    categoryLabel: "Browser Extensions",
    badge: "Manifest V3",
  },
  {
    slug: "hnes",
    title: "Hacker News Enhancement Suite",
    description:
      "Modern Manifest V3 fork of HNES with collapsible comment subtrees, inline keyboard navigation, and custom user tags.",
    screenshot: "/images/tools/hnes/hnes-screenshot.webp",
    tags: ["Chrome", "Hacker News", "Extension"],
    type: "Extension",
    category: "extensions",
    categoryLabel: "Browser Extensions",
    badge: "Manifest V3",
  },
  {
    slug: "clamp-calculator",
    title: "CSS Clamp Calculator",
    description:
      "Interactive CSS clamp() calculator paired with a build-from-zero tutorial explaining the linear interpolation math.",
    screenshot: "/images/tools/clamp-calculator.webp",
    tags: ["CSS", "Responsive", "Tutorial"],
    blogPath: "/blog/tutorial/css-clamp-fluid-responsive-design",
    type: "Tutorial",
    category: "tutorials",
    categoryLabel: "Interactive Tutorials",
    badge: "Fluid Typography",
  },
  {
    slug: "upcoming-domain-extensions",
    title: "Upcoming Domain Extensions",
    description:
      "Every new domain extension applied for in ICANN's 2026 round, plus every live and removed one. Search by name or company, see who applied, and get an alert when one changes.",
    screenshot: "/images/tools/upcoming-domain-extensions.webp",
    tags: ["Domains", "ICANN", "TLD", "Directory"],
    // Built and hosted from its own repo (testy-cool/upcoming-domain-extensions);
    // a Cloudflare Worker serves it at this path.
    blogPath: "/upcoming-domain-extensions/",
    type: "Tool",
    category: "directories",
    categoryLabel: "Directories",
    badge: "Updated daily",
    highlights: [
      "Every 2026 application, with applicant, country and backup choice",
      "Every live and removed ending, from IANA's root zone database",
      "A go-live estimate from the 2012 round's measured pace",
      "Free alerts for one extension or all of them",
    ],
  },
];

/** Get the URL for a tool */
export function getToolUrl(tool: Tool): string {
  return tool.blogPath || `/tools/${tool.slug}`;
}
