export type StackStatus =
  | "using"
  | "dropped"
  | "watching"
  | "replaced"
  | "reading";

export interface StackHistoryEntry {
  date: string;
  note: string;
}

export interface StackTool {
  name: string;
  url?: string;
  logo?: string;
  category: string;
  status: StackStatus;
  replacedBy?: string;
  take: string;
  history?: StackHistoryEntry[];
  children?: StackTool[];
}

export const stack: StackTool[] = [
  // Agents & Models
  {
    name: "Claude",
    url: "https://claude.ai",
    category: "Agents & Models",
    status: "using",
    take: "Max plan (20x). I like Claude Opus 4.6 for deep architectural work and multi-turn refactoring.",
    children: [
      {
        name: "Fable",
        category: "Agents & Models",
        status: "using",
        take: "Fable 5.1 is ok sometimes. In Herdr, I use Codex as a translator between me and Fable, and often have Fable 5.1 order around other agents depending on the case.",
      },
    ],
  },
  {
    name: "Codex",
    url: "https://openai.com",
    category: "Agents & Models",
    status: "using",
    take: "Max plan (20x). I trust 5.6 xhigh sol to not make catastrophic mistakes. Don't really like Astra except for 3D tasks. In Herdr, I often use Codex as a translator between me and Fable 5.1.",
  },
  {
    name: "Antigravity",
    category: "Agents & Models",
    status: "using",
    take: "From Google, powered by Gemini. Used for research and fast implementing because it's fast. I love Gemini 3.8 - super fast and responsive.",
  },
  {
    name: "Pi",
    url: "https://github.com/earendil-works/pi",
    category: "Agents & Models",
    status: "using",
    take: "Minimalist coding agent CLI from Earendil (Mario Zechner / badlogic on GitHub). Paired with DeepSeek 4.1 Flash. Love the feeling of prompt caching making it cost next to nothing.",
  },
  {
    name: "Sitegeist",
    url: "https://github.com/badlogic/sitegeist",
    category: "Agents & Models",
    status: "using",
    take: "AI research and browser agent originally created by Mario Zechner (creator of Pi). I use a custom fork of it for web research and scraping sessions.",
  },
  {
    name: "HermesAgent",
    url: "https://hermes-agent.org",
    category: "Agents & Models",
    status: "using",
    take: "Autonomous personal agent from Nous Research. Run it for fun through WhatsApp to chat and try things out with friends.",
  },

  // CLI Tools
  {
    name: "Herdr",
    url: "https://herdr.dev",
    category: "CLI Tools",
    status: "using",
    take: "Terminal workspace manager for AI coding agents. Replaced Warp. I use it with my [herdr-sidebar-config](https://github.com/testy-cool/herdr-sidebar-config) and [herdr-agent-control](https://github.com/testy-cool/herdr-agent-control) skill to make it easy for agents to talk to each other. In Herdr, I often use Codex as a translator between me and Fable 5.1, or let Fable 5.1 order around other agents depending on the case.",
    history: [
      {
        date: "2026-09-16",
        note: "Switched from Warp as primary agent terminal multiplexer.",
      },
    ],
  },
  {
    name: "whisrs",
    url: "https://y0sif.github.io/whisrs/",
    category: "CLI Tools",
    status: "using",
    take: "Why serious, I guess you could call it. Linux-first voice-to-text dictation written in Rust. Replaced OpenWhispr because OpenWhispr was extremely heavy, annoying, and buggy. whisrs is lightweight, fast, and stays out of the way.",
    history: [
      {
        date: "2026-09-17",
        note: "Replaced OpenWhispr.",
      },
    ],
  },
  {
    name: "llm CLI",
    url: "https://llm.datasette.io",
    category: "CLI Tools",
    status: "using",
    take: "Very versatile to have around in the CLI. Use it for agents to call other LLMs fast. It logs stuff too.",
  },
  {
    name: "Obsidian + AI Canvas",
    url: "https://github.com/testy-cool/obsidian-ai-canvas",
    logo: "https://obsidian.md/favicon.ico",
    category: "CLI Tools",
    status: "using",
    take: "My thinkboard. Obsidian canvas with Gemini connected via a custom plugin - I get a massive context window to branch ideas in different directions. Supports MCP, YouTube videos, images, image generation. Yes it costs money with Gemini, but prompt caching keeps it cheap - the API caches your conversation prefix so repeated turns only bill for the new tokens, not the full context every time. Turns a $2 brainstorm into a $0.30 one.",
  },
  {
    name: "Warp",
    url: "https://www.warp.dev",
    category: "CLI Tools",
    status: "dropped",
    replacedBy: "Herdr",
    take: "I used to love how it handled organization with tabs and panes without touching AI features. Dropped it once my workflow moved toward multi-agent coordination in Herdr.",
    history: [
      {
        date: "2026-09-16",
        note: "Dropped for Herdr for terminal workspaces and agent coordination.",
      },
    ],
  },
  {
    name: "OpenWhispr",
    url: "https://github.com/OpenWhispr/OpenWhispr",
    logo: "https://avatars.githubusercontent.com/u/254803777?s=48&v=4",
    category: "CLI Tools",
    status: "dropped",
    replacedBy: "whisrs",
    take: "Dropped for whisrs. Extremely heavy, annoying, and buggy on Linux. Audio profile switching on Bluetooth was a mess.",
    history: [
      {
        date: "2026-09-17",
        note: "Dropped for whisrs.",
      },
    ],
  },

  // LLM Routing
  {
    name: "Bifrost",
    url: "https://github.com/maximhq/bifrost",
    logo: "https://framerusercontent.com/images/k49dViw06yckDjJt5uERdfTSjU.png",
    category: "LLM Routing",
    status: "using",
    take: "Still my daily driver proxy for routing LLM calls. Go binary, light memory footprint (111 MiB RAM vs 5.5 GiB with LiteLLM proxy).",
    history: [
      {
        date: "2026-05-03",
        note: "Replaced LiteLLM proxy. Go binary, 111 MiB RAM vs 5.5 GiB.",
      },
    ],
  },
  {
    name: "LiteLLM SDK",
    url: "https://github.com/BerriAI/litellm",
    logo: "https://icons.duckduckgo.com/ip3/litellm.ai.ico",
    category: "LLM Routing",
    status: "using",
    take: "My preferred routing SDK, but since that supply chain incident I've been slowly moving to native libs like google-genai for Gemini and so on. Heard LiteLLM is being rewritten in Rust, which I like - definitely looking forward to that.",
    history: [
      {
        date: "2026-09-16",
        note: "Watching the upcoming Rust rewrite.",
      },
    ],
  },
  {
    name: "LiteLLM Proxy UI",
    url: "https://github.com/BerriAI/litellm",
    logo: "https://icons.duckduckgo.com/ip3/litellm.ai.ico",
    category: "LLM Routing",
    status: "dropped",
    replacedBy: "Bifrost",
    take: "Heavy as fuck even on standby. Had many options I wanted to explore but never found the time. Switched to Bifrost and don't miss it.",
    history: [
      {
        date: "2026-05-03",
        note: "Replaced by Bifrost. LiteLLM proxy was using 5.5 GiB RAM with 8 Python workers.",
      },
    ],
  },

  // Observability
  {
    name: "Laminar",
    url: "https://lmnr.ai",
    logo: "https://icons.duckduckgo.com/ip3/laminar.sh.ico",
    category: "Observability",
    status: "using",
    take: "Using it for browser agents. Feels better than Langfuse - has recording preview, SQL editor to pull traces, AI integration, and MCP support with Claude Code. More flexible and better thought-out for my use case, and fast loading too. Love it.",
  },
  {
    name: "Langfuse",
    url: "https://langfuse.com",
    category: "Observability",
    status: "using",
    take: "Using it for pipeline traces - it's crowded and heavy but it's the standard. Not using its evals or prompts features, just traces. I prefer custom-generated UI for evals. Built myself a CLI to pull traces so Claude Code can analyze them.",
    history: [
      {
        date: "2026-03-28",
        note: "Switched from Langfuse Cloud to self-hosted.",
      },
    ],
  },

  // Infrastructure & Automation
  {
    name: "Coolify",
    url: "https://coolify.io",
    category: "Infrastructure & Automation",
    status: "using",
    take: "Love it. Still use Cloudflare Pages for some stuff, but Coolify is versatile as hell.",
  },
  {
    name: "Windmill",
    url: "https://windmill.dev",
    category: "Infrastructure & Automation",
    status: "using",
    take: "I like it but I'm not great with managing workers, and the community version has some annoying limitations. May move to Kestra so people can see flows easily. It's way easier on the brain for me to just push to git and deploy.",
  },

  // Blogs I Read
  {
    name: "Hamel Hussein",
    url: "https://hamel.dev",
    category: "Blogs I Read",
    status: "reading",
    take: "One of the top authorities on evals. Very pragmatic, cuts to the chase, and focuses on what actually works instead of assumptions or gut feelings. Does the rigorous work and encourages everyone else to do the same.",
  },
  {
    name: "Simon Willison",
    url: "https://simonwillison.net",
    category: "Blogs I Read",
    status: "reading",
    take: "One of the most prolific and insightful developers in AI. Researches at lightning speed, stays on top of everything emerging, and explains complex tech in a very clear, approachable, and easy-to-read way.",
  },
  {
    name: "Dylan Castillo",
    url: "https://dylancastillo.co",
    category: "Blogs I Read",
    status: "reading",
    take: "Writes grounded, practical posts on data science, LLMs, and agents. Doesn't parrot generic advice - shares hands-on experience and real takeaways that validate what actually happens in practice.",
  },
  {
    name: "Michael Lynch",
    url: "https://mtlynch.io",
    category: "Blogs I Read",
    status: "reading",
    take: "Fantastic, thoughtful writer. I pre-ordered his book. He writes with immense clarity - it looks simple from the outside, but only because he focuses so much on communicating correctly and respecting people's time. That's what I aspire to.",
  },
];

export function getStackByCategory(): Record<string, StackTool[]> {
  const grouped: Record<string, StackTool[]> = {};
  for (const tool of stack) {
    const categoryTools = grouped[tool.category] ?? [];
    categoryTools.push(tool);
    grouped[tool.category] = categoryTools;
  }
  return grouped;
}
