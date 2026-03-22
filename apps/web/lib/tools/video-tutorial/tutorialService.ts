import type { Tutorial, TutorialSummary, TutorialVersion } from "./types";

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

export async function generateTutorial(videoId: string, force?: boolean, model?: string): Promise<Tutorial> {
  const body: Record<string, unknown> = { videoId };
  if (force) body.force = true;
  if (model) body.model = model;
  const res = await fetch("/api/tutorial/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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

export async function getVersions(videoId: string): Promise<TutorialVersion[]> {
  try {
    const res = await fetch(`/api/tutorial/generate?action=versions&videoId=${videoId}`);
    const data = await res.json();
    return data.versions || [];
  } catch {
    return [];
  }
}

export async function getVersion(videoId: string, version: number): Promise<Tutorial> {
  const res = await fetch(`/api/tutorial/generate?action=version&videoId=${videoId}&v=${version}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.tutorial;
}

export async function getPrompt(): Promise<string> {
  const res = await fetch("/api/tutorial/generate?action=prompt");
  const data = await res.json();
  return data.prompt || "";
}

export async function updatePrompt(prompt: string, password: string): Promise<void> {
  const res = await fetch("/api/tutorial/generate", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "updatePrompt", prompt, password }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error);
}
