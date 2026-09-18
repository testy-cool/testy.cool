export type ChangelogType = "stack" | "tool" | "post" | "site";

export interface ChangelogEntry {
  id: string;
  date: string;
  displayDate: string;
  shortDate: string;
  title: string;
  description: string;
  type: ChangelogType;
  href?: string;
}

export const changelogEntries: ChangelogEntry[] = [
  {
    id: "archtoys-stack",
    date: "2026-09-18",
    displayDate: "September 18, 2026",
    shortDate: "Sep 18",
    title: "Added Archtoys to Stack",
    description:
      "Added Archtoys under CLI Tools - a Linux alternative to Windows PowerToys with a fast color picker and desktop utilities.",
    type: "stack",
    href: "/stack",
  },
  {
    id: "repoaura-sitegeist-tools",
    date: "2026-09-17",
    displayDate: "September 17, 2026",
    shortDate: "Sep 17",
    title: "Added RepoAura and Sitegeist to Tools",
    description:
      "Created dedicated tool pages for RepoAura (GitHub repository health overlays) and Sitegeist (browser extension for automation, UI artifacts, and research).",
    type: "tool",
    href: "/tools",
  },
  {
    id: "whisrs-stack",
    date: "2026-09-17",
    displayDate: "September 17, 2026",
    shortDate: "Sep 17",
    title: "Switched to whisrs in Stack",
    description:
      "Replaced OpenWhispr with whisrs (Linux-first voice-to-text dictation written in Rust).",
    type: "stack",
    href: "/stack",
  },
  {
    id: "herdr-stack",
    date: "2026-09-16",
    displayDate: "September 16, 2026",
    shortDate: "Sep 16",
    title: "Switched to Herdr for Terminal Workspaces",
    description:
      "Replaced Warp with Herdr as primary terminal multiplexer for multi-agent coordination.",
    type: "stack",
    href: "/stack",
  },
  {
    id: "blogs-stack",
    date: "2026-09-16",
    displayDate: "September 16, 2026",
    shortDate: "Sep 16",
    title: "Added Recommended Blogs to Stack",
    description:
      "Curated reading list with personal takes on Hamel Hussein, Simon Willison, Dylan Castillo, and Michael Lynch.",
    type: "stack",
    href: "/stack",
  },
  {
    id: "initial-launch",
    date: "2026-01-06",
    displayDate: "January 6, 2026",
    shortDate: "Jan 06",
    title: "Initial Launch & Notes",
    description:
      "Launched testy.cool on Next.js 15 and Fumadocs with interactive tools and technical troubleshooting notes.",
    type: "site",
    href: "/blog",
  },
];

export const latestUpdate = changelogEntries[0];
