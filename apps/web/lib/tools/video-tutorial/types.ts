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
  | { type: "list"; items: string[] };

export interface Tutorial {
  videoId: string;
  videoTitle: string;
  title: string;
  steps: TutorialStep[];
  generatedAt: number;
}

export interface TutorialSummary {
  videoId: string;
  title: string;
  stepCount: number;
  timestamp: number;
}
