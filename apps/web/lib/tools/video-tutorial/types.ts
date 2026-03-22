export interface TutorialStep {
  startSeconds: number;
  endSeconds: number;
  tag: string;
  tagType: "intro" | "concept" | "setup" | "action";
  title: string;
  blocks: TutorialBlock[];
}

export type TutorialBlock = {
  type: string;
  html?: string;
  code?: string;
  language?: string;
  timestamp?: number;
  caption?: string;
  [key: string]: unknown;
};

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
