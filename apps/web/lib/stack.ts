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
    name: "LiteLLM SDK",
    url: "https://github.com/BerriAI/litellm",
    logo: "https://icons.duckduckgo.com/ip3/litellm.ai.ico",
    category: "LLM Routing",
    status: "using",
    take: "My preferred routing SDK, but since that supply chain incident I've been slowly moving to native libs like google-genai for Gemini and so on.",
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
    take: "",
    history: [
      {
        date: "2026-05-03",
        note: "Replaced LiteLLM proxy. Go binary, 111 MiB RAM vs 5.5 GiB.",
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
    if (!grouped[tool.category]) grouped[tool.category] = [];
    grouped[tool.category].push(tool);
  }
  return grouped;
}
