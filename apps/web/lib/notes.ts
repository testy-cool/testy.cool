export const noteStatusValues = [
  "draft",
  "published",
  "evergreen",
  "archived",
] as const;

export type NoteStatus = (typeof noteStatusValues)[number];

export const noteConfidenceValues = ["low", "medium", "high"] as const;

export type NoteConfidence = (typeof noteConfidenceValues)[number];

export const noteResumeSignalValues = [
  "none",
  "supporting",
  "featured",
] as const;

export type NoteResumeSignal = (typeof noteResumeSignalValues)[number];
