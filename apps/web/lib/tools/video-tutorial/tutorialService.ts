import type { Tutorial, TutorialSummary } from "./types";

export function parseVideoId(input: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /embed\/([a-zA-Z0-9_-]{11})/,
    /\/v\/([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = input.trim().match(p);
    if (m) return m[1];
  }
  return null;
}

export async function generateTutorial(videoId: string): Promise<Tutorial> {
  const res = await fetch("/api/tutorial/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoId }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.tutorial;
}

export async function getRecentTutorials(): Promise<TutorialSummary[]> {
  try {
    const res = await fetch("/api/tutorial/generate?action=recent");
    const data = await res.json();
    return data.tutorials || [];
  } catch {
    return [];
  }
}
