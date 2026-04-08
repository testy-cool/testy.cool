import type {
  Tutorial,
  TutorialGenerateResponse,
  TutorialState,
  TutorialSummary,
  TutorialVersion,
} from "./types";

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
    const videoId = m?.[1];
    if (videoId) return videoId;
  }
  return null;
}

export async function generateTutorial(
  videoId: string,
  force?: boolean,
  model?: string,
  customNote?: string,
): Promise<TutorialGenerateResponse> {
  const body: Record<string, unknown> = { videoId };
  if (customNote) body.customNote = customNote;
  const url = force ? "/api/tutorial/generate?intent=refresh" : "/api/tutorial/generate";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await parseResponse(res);
  if (data.tutorial || data.job || data.status) return data;
  throw new Error("Unexpected response from server");
}

export async function getTutorialState(videoId: string): Promise<TutorialState> {
  const res = await fetch(`/api/tutorial/generate?videoId=${videoId}`);
  return parseResponse(res);
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
