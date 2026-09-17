export type StackStatus = "using" | "dropped" | "watching" | "replaced";

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
}

export const stack: StackTool[] = [
  {
    name: "Codex",
    url: "https://openai.com",
    category: "Agents & Models",
    status: "using",
    take: "Max plan (20x). I trust 5.6 xhigh sol to not make catastrophic mistakes. Don't really like Astra except for 3D tasks. In Herdr, I often use Codex as a translator between me and Fable 5.1.",
  },
  {
    name: "Claude",
    url: "https://claude.ai",
    category: "Agents & Models",
    status: "using",
    take: "Max plan (20x). I like Claude Opus 4.6 for deep architectural work and multi-turn refactoring.",
  },
  {
    name: "Fable",
    category: "Agents & Models",
    status: "using",
    take: "Fable 5.1 is ok sometimes. In Herdr, I use Codex as a translator between me and Fable, and often have Fable 5.1 order around other agents depending on the case.",
  },
  {
    name: "Antigravity",
    category: "Agents & Models",
    status: "using",
    take: "Used for research and fast implementing because it's fast.",
  },
  {
    name: "Pi + DeepSeek 4.1 Flash",
    url: "https://github.com/mwh/pi",
    category: "Agents & Models",
    status: "using",
    take: "Pi CLI paired with DeepSeek 4.1 Flash. Love the feeling of prompt caching making it cost next to nothing.",
  },
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
    name: "Warp",
    url: "https://www.warp.dev",
    category: "CLI Tools",
    status: "replaced",
    replacedBy: "Herdr",
    take: "I used to love how it handled organization with tabs and panes without touching AI features. Dropped it once my workflow moved toward multi-agent coordination in Herdr.",
    history: [
      {
        date: "2026-09-16",
        note: "Replaced by Herdr for terminal workspaces and agent coordination.",
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
    name: "OpenWhispr",
    url: "https://github.com/OpenWhispr/OpenWhispr",
    logo: "https://avatars.githubusercontent.com/u/254803777?s=48&v=4",
    category: "CLI Tools",
    status: "using",
    take: "Open-source speech-to-text, works on Linux with OpenAI's Whisper model. No account needed, bring your own key. Polished UI for what it is. Two annoyances: doesn't pause system audio while recording, and Bluetooth headphones switch to hands-free profile (garbage quality) when the mic activates. Building a wrapper to handle audio profile switching automatically.",
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
  {
    name: "Laminar",
    url: "https://lmnr.ai",
    logo: "https://icons.duckduckgo.com/ip3/laminar.sh.ico",
    category: "Observability",
    status: "using",
    take: "Using it for browser agents. Feels better than Langfuse - has recording preview, SQL editor to pull traces, AI integration, and MCP support with Claude Code. More flexible and better thought-out for my use case, and fast loading too. Love it.",
  },
  {
    name: "Windmill",
    url: "https://windmill.dev",
    category: "Automation",
    status: "using",
    take: "I like it but I'm not great with managing workers, and the community version has some annoying limitations. May move to Kestra so people can see flows easily. It's way easier on the brain for me to just push to git and deploy.",
  },
  {
    name: "Coolify",
    url: "https://coolify.io",
    category: "Infrastructure",
    status: "using",
    take: "Love it. Still use Cloudflare Pages for some stuff, but Coolify is versatile as hell.",
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
