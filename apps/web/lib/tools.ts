export type ToolType = "Tool" | "Tutorial" | "Extension";
export type ToolCategory =
  | "ai-prompting"
  | "text-nlp"
  | "extensions"
  | "tutorials";

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
      "Lightweight Manifest V3 extensions for ChatGPT conversation export and Hacker News power features.",
  },
  {
    id: "tutorials",
    label: "Interactive Tutorials",
    description:
      "Deep-dive technical guides paired with custom interactive calculators built from zero.",
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
];

/** Get the URL for a tool */
export function getToolUrl(tool: Tool): string {
  return tool.blogPath || `/tools/${tool.slug}`;
}
