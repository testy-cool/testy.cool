export interface TutorialStep {
  startSeconds: number;
  endSeconds: number;
  tag: string;
  tagType: "intro" | "concept" | "setup" | "action";
  title: string;
  blocks: TutorialBlock[];
}

export type TutorialBlock =
  | { type: "paragraph"; html: string }
  | { type: "code"; language: string; code: string }
  | { type: "tldr"; html: string }
  | { type: "concept"; title: string; html: string }
  | { type: "list"; items: string[] }
  | { type: "screenshot"; timestamp: number; caption: string; frameData?: string }
  | { type: "flow"; caption?: string; steps: string[] }
  | { type: "comparison"; caption?: string; headers: string[]; rows: string[][] }
  | { type: "architecture"; caption?: string; layers: { name: string; items: string[] }[] };

export interface Tutorial {
  videoId: string;
  videoTitle: string;
  title: string;
  summary?: string;
  steps: TutorialStep[];
  generatedAt: number;
}

export interface TutorialSummary {
  videoId: string;
  title: string;
  stepCount: number;
  timestamp: number;
}

export interface TutorialVersion {
  version: number;
  timestamp: number;
  stepCount: number;
}
