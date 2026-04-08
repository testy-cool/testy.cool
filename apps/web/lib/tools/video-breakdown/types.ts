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
  category?: string;
  transcript?: string;
  incentiveAnalysis?: string;
  channelIncentive?: string;
  hypeLevel?: string;
  trustLevel?: string;
  evidenceLevel?: string;
  whoShouldCare?: string;
  whatToDoAboutIt?: string;
  steps: TutorialStep[];
  generatedAt: number;
}

export interface TutorialSummary {
  videoId: string;
  title: string;
  category?: string;
  stepCount: number;
  timestamp: number;
}

export interface TutorialVersion {
  version: number;
  timestamp: number;
  stepCount: number;
}

export type TutorialJobState = "queued" | "running" | "succeeded" | "failed";

export interface TutorialJob {
  id: string;
  videoId: string;
  state: TutorialJobState;
  windmillJobId?: string;
  createdAt: number;
  updatedAt: number;
  error?: string;
  resultVersion?: number;
  model?: string;
}

export interface TutorialState {
  tutorial: Tutorial | null;
  job: TutorialJob | null;
  pending: boolean;
  error?: string;
}

export interface TutorialGenerateResponse {
  tutorial?: Tutorial;
  job?: TutorialJob;
  cached?: boolean;
  status?: TutorialJobState;
}
