import type { Tutorial, TutorialSummary, TutorialVersion } from "./types";

async function parseResponse(res: Response) {
  const text = await res.text();
  try {
    const data = JSON.parse(text);
    if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
    return data;
  } catch (e) {
    if (e instanceof SyntaxError) {
      throw new Error(`Server error (${res.status}). Try again.`);
    }
    throw e;
  }
}

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

export async function generateTutorial(videoId: string, force?: boolean, model?: string, customNote?: string): Promise<Tutorial> {
  const body: Record<string, unknown> = { videoId };
  if (force) body.force = true;
  if (model) body.model = model;
  if (customNote) body.customNote = customNote;
  const res = await fetch("/api/tutorial/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);

  // Cached result: return immediately
  if (data.tutorial) return data.tutorial;

  // Server scheduled background generation. Poll until done.
  if (data.status === "pending") {
    return pollForTutorial(videoId, !!force);
  }

  throw new Error("Unexpected response from server");
}

async function pollForTutorial(videoId: string, force: boolean): Promise<Tutorial> {
  const MAX_WAIT_MS = 5 * 60 * 1000; // 5 min, matches server lock TTL
  const POLL_INTERVAL_MS = 3000;
  const startedAt = Date.now();
  // For force regen, remember the old generatedAt so we don't return stale data
  let staleGeneratedAt: number | null = null;
  if (force) {
    try {
      const pre = await fetch(`/api/tutorial/generate?videoId=${videoId}`);
      const preData = await pre.json();
      if (preData?.tutorial?.generatedAt) staleGeneratedAt = preData.tutorial.generatedAt;
    } catch {}
  }

  while (Date.now() - startedAt < MAX_WAIT_MS) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    let data: { tutorial?: Tutorial; pending?: boolean; error?: string };
    try {
      const res = await fetch(`/api/tutorial/generate?videoId=${videoId}`);
      data = await res.json();
    } catch {
      continue; // transient network blip; retry next tick
    }
    if (data.error) throw new Error(data.error);
    if (data.tutorial && !data.pending) {
      // On force regen, skip the stale copy until the new one lands
      if (staleGeneratedAt && data.tutorial.generatedAt === staleGeneratedAt) continue;
      return data.tutorial;
    }
  }
  throw new Error("Generation timed out after 5 minutes. Try again.");
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
    return (data.versions || []).map((v: { version: number; generatedAt: number }) => ({
      version: v.version,
      timestamp: v.generatedAt,
      stepCount: 0,
    }));
  } catch {
    return [];
  }
}

export async function getVersion(videoId: string, version: number): Promise<Tutorial> {
  const res = await fetch(`/api/tutorial/generate?action=version&videoId=${videoId}&v=${version}`);
  const data = await parseResponse(res);
  return data.tutorial;
}

export async function getPrompt(): Promise<string> {
  const res = await fetch("/api/tutorial/generate?action=prompt");
  const data = await res.json();
  return data.prompt || "";
}

export async function chatWithTutorial(
  videoId: string,
  message: string,
  history: { role: string; text: string }[],
  convId?: string,
  parentId?: string,
): Promise<{ reply: string; convId: string }> {
  const body: Record<string, unknown> = { action: "chat", videoId, message, history };
  if (convId) body.convId = convId;
  if (parentId) body.parentId = parentId;
  const res = await fetch("/api/tutorial/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  return { reply: data.reply, convId: data.convId };
}

export interface ConversationSummary {
  id: string;
  preview: string;
  messageCount: number;
  createdAt: number;
  parentId?: string;
}

export interface Conversation {
  id: string;
  videoId: string;
  parentId?: string;
  messages: { role: string; text: string }[];
  createdAt: number;
}

export async function getConversations(videoId: string): Promise<ConversationSummary[]> {
  try {
    const res = await fetch(`/api/tutorial/generate?action=conversations&videoId=${videoId}`);
    const data = await res.json();
    return data.conversations || [];
  } catch {
    return [];
  }
}

export async function getConversation(videoId: string, id: string): Promise<Conversation | null> {
  try {
    const res = await fetch(`/api/tutorial/generate?action=conversation&videoId=${videoId}&id=${id}`);
    const data = await res.json();
    return data.conversation || null;
  } catch {
    return null;
  }
}

export async function updatePrompt(prompt: string, password: string): Promise<void> {
  const res = await fetch("/api/tutorial/generate", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "updatePrompt", prompt, password }),
  });
  const data = await parseResponse(res);
}
