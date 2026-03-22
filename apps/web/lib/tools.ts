export interface Tool {
  slug: string;
  title: string;
  description: string;
  screenshot?: string;
  tags?: string[];
  /** If tool is embedded in a blog post, link there instead of /tools/[slug] */
  blogPath?: string;
  /** Display type: "Tool", "Tutorial", "Extension" */
  type: "Tool" | "Tutorial" | "Extension";
}

export const allTools: Tool[] = [
  {
    slug: "llm-price-calculator",
    title: "LLM Price Calculator",
    description:
      "Calculator for checking API costs across Claude, GPT, and Gemini, including prompt caching.",
    screenshot: "/images/tools/llm-price-calculator.png",
    tags: ["LLM", "API", "Pricing"],
    type: "Tool",
  },
  {
    slug: "channel-pantry",
    title: "Channel Pantry",
    description:
      "Analyze a YouTube cooking channel to see what ingredients they use most.",
    screenshot: "/images/tools/channel-pantry.png",
    tags: ["YouTube", "AI", "Cooking"],
    type: "Tool",
  },
  {
    slug: "clamp-calculator",
    title: "CSS Clamp Calculator",
    description:
      "Clamp() calculator plus the tutorial explaining the math behind it.",
    screenshot: "/images/tools/clamp-calculator.png",
    tags: ["CSS", "Responsive", "Tutorial"],
    blogPath: "/blog/tutorial/css-clamp-fluid-responsive-design",
    type: "Tutorial",
  },
  {
    slug: "video-breakdown",
    title: "Video Breakdown",
    description:
      "Paste a YouTube URL. AI watches the video and writes a scroll-synced text breakdown.",
    screenshot: "/images/tools/video-breakdown.png",
    tags: ["YouTube", "AI"],
    type: "Tool",
  },
  {
    slug: "chatgpt-conversation-exporter",
    title: "ChatGPT Conversation Exporter",
    description:
      "Browser extension for exporting one ChatGPT conversation to Markdown or HTML.",
    screenshot:
      "/images/tools/chatgpt-conversation-exporter/export-chatgpt-conversation-markdown-html.webp",
    tags: ["Chrome", "Export"],
    type: "Extension",
  },
  {
    slug: "hnes",
    title: "Hacker News Enhancement Suite",
    description:
      "Manifest V3 fork of HNES with collapsible comments, keyboard shortcuts, and user tags.",
    screenshot: "/images/tools/hnes/hnes-screenshot.webp",
    tags: ["Chrome", "Hacker News"],
    type: "Extension",
  },
];

/** Get the URL for a tool */
export function getToolUrl(tool: Tool): string {
  return tool.blogPath || `/tools/${tool.slug}`;
}
