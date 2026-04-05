import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-3-flash-preview";
const ALLOWED_MODELS = ["gemini-3-flash-preview", "gemini-3.1-pro-preview"];
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MAX_RECENT = 20;
const MAX_VERSIONS = 20;
const RECENT_KEY = "recent_tutorials";
const PROMPT_KEY = "config:tutorial_prompt";

interface Env {
  GEMINI_API_KEY: string;
  PANTRY_CACHE: KVNamespace;
  LANGFUSE_SECRET_KEY?: string;
  LANGFUSE_PUBLIC_KEY?: string;
  LANGFUSE_BASE_URL?: string;
}

interface VersionMeta {
  currentVersion: number;
  versions: { version: number; generatedAt: number; prompt?: string }[];
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// GET: list recent tutorials, load cached tutorial, prompt, version history
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const kv = context.env.PANTRY_CACHE;
  if (!kv) return json({ error: "KV not configured" }, 502);

  const url = new URL(context.request.url);
  const action = url.searchParams.get("action");
  const videoId = url.searchParams.get("videoId");

  if (action === "recent") {
    const raw = await kv.get(RECENT_KEY);
    return json({ tutorials: raw ? JSON.parse(raw) : [] });
  }

  if (action === "prompt") {
    const stored = await kv.get(PROMPT_KEY);
    return json({ prompt: stored || buildPrompt("{videoTitle}") });
  }

  if (action === "versions" && videoId) {
    const metaRaw = await kv.get(`tutorial:${videoId}:meta`);
    if (!metaRaw) return json({ versions: [] });
    const meta: VersionMeta = JSON.parse(metaRaw);
    return json({ versions: meta.versions });
  }

  if (action === "version" && videoId) {
    const v = url.searchParams.get("v");
    if (!v) return json({ error: "Missing version number" }, 400);
    const raw = await kv.get(`tutorial:${videoId}:v${v}`);
    return json({ tutorial: raw ? JSON.parse(raw) : null });
  }

  if (action === "conversations" && videoId) {
    const raw = await kv.get(`chat:${videoId}:index`);
    return json({ conversations: raw ? JSON.parse(raw) : [] });
  }

  if (action === "conversation" && videoId) {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing conversation id" }, 400);
    const raw = await kv.get(`chat:${videoId}:${id}`);
    return json({ conversation: raw ? JSON.parse(raw) : null });
  }

  if (videoId) {
    const [raw, lockRaw, errRaw] = await Promise.all([
      kv.get(`tutorial:${videoId}`),
      kv.get(`generating:${videoId}`),
      kv.get(`tutorial:${videoId}:error`),
    ]);
    const tutorial = raw ? JSON.parse(raw) : null;
    return json({
      tutorial,
      pending: !!lockRaw,
      ...(errRaw ? { error: errRaw } : {}),
    });
  }

  return json({ error: "Missing action or videoId" }, 400);
};

// PUT: update prompt
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const kv = context.env.PANTRY_CACHE;
  if (!kv) return json({ error: "KV not configured" }, 502);

  let body: { action?: string; prompt?: string; password?: string };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (body.action === "updatePrompt") {
    if (body.password !== "penis") {
      return json({ error: "Invalid password" }, 403);
    }
    if (body.prompt === "__reset__") {
      await kv.delete(PROMPT_KEY);
      return json({ success: true, reset: true });
    }
    if (!body.prompt || typeof body.prompt !== "string") {
      return json({ error: "Missing prompt" }, 400);
    }
    await kv.put(PROMPT_KEY, body.prompt);
    return json({ success: true });
  }

  return json({ error: "Unknown action" }, 400);
};

// POST: generate tutorial (returns cached if available, force bypasses cache)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: "Gemini API key not configured" }, 502);

  const kv = context.env.PANTRY_CACHE;
  if (!kv) return json({ error: "KV not configured" }, 502);

  let body: { action?: string; videoId: string; force?: boolean; model?: string; customNote?: string; message?: string; history?: { role: string; text: string }[]; convId?: string; parentId?: string };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  // Chat action
  if (body.action === "chat") {
    return handleChat(context.env, body.videoId, body.message || "", body.history || [], body.convId, body.parentId);
  }

  const { videoId, force } = body;
  const customNote = typeof body.customNote === "string" ? body.customNote.slice(0, 500) : "";
  const model = body.model && ALLOWED_MODELS.includes(body.model) ? body.model : DEFAULT_MODEL;
  if (!videoId || typeof videoId !== "string") {
    return json({ error: "Missing videoId" }, 400);
  }

  // Validate video ID format
  const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
  if (!VIDEO_ID_REGEX.test(videoId)) {
    return json({ error: "Invalid video ID format" }, 400);
  }

  // Check cache (skip when force)
  if (!force) {
    const cached = await kv.get(`tutorial:${videoId}`);
    if (cached) {
      const cachedTutorial = JSON.parse(cached);
      // Don't return broken cached tutorials - delete and regenerate
      if (!cachedTutorial.steps || cachedTutorial.steps.length === 0) {
        await kv.delete(`tutorial:${videoId}`);
        await kv.delete(`generating:${videoId}`);
      } else {
        return json({ tutorial: cachedTutorial, cached: true });
      }
    }
  }

  // Rate limit (always applies, even with force)
  const ip = context.request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitKey = `ratelimit:${ip}`;
  const rateLimitRaw = await kv.get(rateLimitKey);
  const rateLimitCount = rateLimitRaw ? parseInt(rateLimitRaw, 10) : 0;
  if (rateLimitCount >= 10) {
    return json(
      { error: "Rate limit exceeded. Max 10 generations per hour." },
      429,
    );
  }
  await kv.put(rateLimitKey, String(rateLimitCount + 1), {
    expirationTtl: 3600,
  });

  // Generation lock
  const lockKey = `generating:${videoId}`;
  if (force) {
    // Force: delete any existing lock
    await kv.delete(lockKey);
  } else {
    const existingLock = await kv.get(lockKey);
    if (existingLock) {
      // Another request is already generating. Tell client to poll.
      return json({ status: "pending", videoId });
    }
  }
  // 5 min TTL: matches client polling timeout, ensures stuck jobs self-heal
  await kv.put(lockKey, "1", { expirationTtl: 300 });
  // Clear any previous error from a failed run
  await kv.delete(`tutorial:${videoId}:error`);

  // Kick off background generation via waitUntil so we can return immediately.
  // This avoids Cloudflare's 100s edge timeout (524) on long Gemini calls.
  // Client polls GET /api/tutorial/generate?videoId=X until done.
  context.waitUntil(runGeneration(context.env, videoId, !!force, model, customNote));

  return json({ status: "pending", videoId });
};

async function runGeneration(
  env: Env,
  videoId: string,
  force: boolean,
  model: string,
  customNote: string,
): Promise<void> {
  const kv = env.PANTRY_CACHE;
  const apiKey = env.GEMINI_API_KEY;
  const lockKey = `generating:${videoId}`;
  const errorKey = `tutorial:${videoId}:error`;

  const writeError = async (msg: string) => {
    try {
      await kv.put(errorKey, msg, { expirationTtl: 300 });
      await kv.delete(lockKey);
    } catch {}
  };

  try {
    // 1. Get video title via oEmbed
    const videoTitle = await getVideoTitle(videoId);

    // 2. Determine prompt: check KV for custom prompt, fall back to hardcoded
    const storedPrompt = await kv.get(PROMPT_KEY);
    const prompt = storedPrompt || buildPrompt(videoTitle);
    let finalPrompt = storedPrompt
      ? storedPrompt.replace(/\{videoTitle\}/g, videoTitle)
      : prompt;
    if (customNote) {
      finalPrompt += `\n\n## ADDITIONAL INSTRUCTIONS FROM USER\n${customNote}`;
    }

    // 3. Send YouTube video directly to Gemini for analysis
    const ai = new GoogleGenAI({ apiKey });
    const genStartTime = new Date().toISOString();

    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            {
              fileData: {
                fileUri: `https://www.youtube.com/watch?v=${videoId}`,
                mimeType: "video/mp4",
              },
            },
            { text: finalPrompt },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 2048 },
        tools: [
          { googleSearch: {} },
          { urlContext: {} },
        ],
      },
    });

    const genEndTime = new Date().toISOString();
    const text = response.text;
    if (!text) {
      await writeError("Empty response from Gemini");
      return;
    }

    // Langfuse trace
    const usageMeta = response.usageMetadata;
    await langfuseTrace(env, {
      traceId: `tut-${videoId}-${Date.now()}`,
      name: `tutorial:${videoId}`,
      input: finalPrompt,
      output: text,
      model,
      startTime: genStartTime,
      endTime: genEndTime,
      metadata: { videoId, videoTitle, force },
      modelParameters: { responseMimeType: "application/json", thinkingBudget: 2048 },
      usage: usageMeta ? {
        input: usageMeta.promptTokenCount,
        output: usageMeta.candidatesTokenCount,
        total: usageMeta.totalTokenCount,
      } : undefined,
    });

    let tutorialData: { title?: string; steps?: unknown[] };
    try {
      tutorialData = JSON.parse(text);
    } catch {
      await writeError("Failed to parse tutorial data");
      return;
    }

    const tutorial = {
      videoId,
      videoTitle,
      title: tutorialData.title || videoTitle,
      summary: (tutorialData as any).summary || "",
      category: (tutorialData as any).category || "",
      transcript: (tutorialData as any).transcript || "",
      incentiveAnalysis: (tutorialData as any).incentiveAnalysis || "",
      steps: tutorialData.steps || [],
      generatedAt: Date.now(),
    };

    // Validate tutorial has steps before caching
    if (!tutorial.steps || (tutorial.steps as unknown[]).length === 0) {
      await writeError("Failed to generate tutorial content. Please try again.");
      return;
    }

    // 4. Version history: store versioned entry and update metadata
    const metaRaw = await kv.get(`tutorial:${videoId}:meta`);
    const meta: VersionMeta = metaRaw
      ? JSON.parse(metaRaw)
      : { currentVersion: 0, versions: [] };

    const newVersion = meta.currentVersion + 1;
    meta.currentVersion = newVersion;
    meta.versions.push({
      version: newVersion,
      generatedAt: tutorial.generatedAt,
      prompt: storedPrompt ? "(custom)" : undefined,
    });

    // Cap at MAX_VERSIONS: drop oldest
    if (meta.versions.length > MAX_VERSIONS) {
      const dropped = meta.versions.splice(0, meta.versions.length - MAX_VERSIONS);
      for (const d of dropped) {
        await kv.delete(`tutorial:${videoId}:v${d.version}`);
      }
    }

    // Store versioned copy
    await kv.put(`tutorial:${videoId}:v${newVersion}`, JSON.stringify(tutorial), {
      expirationTtl: TTL_SECONDS,
    });

    // Store metadata
    await kv.put(`tutorial:${videoId}:meta`, JSON.stringify(meta), {
      expirationTtl: TTL_SECONDS,
    });

    // Store main key (this is what the client polls for)
    await kv.put(`tutorial:${videoId}`, JSON.stringify(tutorial), {
      expirationTtl: TTL_SECONDS,
    });

    // 5. Update recent list
    const raw = await kv.get(RECENT_KEY);
    const recent: { videoId: string }[] = raw ? JSON.parse(raw) : [];
    const summary = {
      videoId,
      title: tutorial.title,
      category: tutorial.category,
      stepCount: (tutorial.steps as unknown[]).length,
      timestamp: Date.now(),
    };
    const updated = [
      summary,
      ...recent.filter((t) => t.videoId !== videoId),
    ].slice(0, MAX_RECENT);
    await kv.put(RECENT_KEY, JSON.stringify(updated));

    // 6. Delete generation lock LAST - signals completion to polling clients
    await kv.delete(lockKey);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    await writeError(msg);
  }
}

async function handleChat(
  env: Env,
  videoId: string,
  message: string,
  history: { role: string; text: string }[],
  convId?: string,
  parentId?: string,
): Promise<Response> {
  if (!videoId || !message) return json({ error: "Missing videoId or message" }, 400);

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: "Gemini API key not configured" }, 502);

  const kv = env.PANTRY_CACHE;
  if (!kv) return json({ error: "KV not configured" }, 502);

  // Load cached tutorial for context
  const raw = await kv.get(`tutorial:${videoId}`);
  if (!raw) return json({ error: "No tutorial found for this video. Generate one first." }, 404);

  const tutorial = JSON.parse(raw);
  const context = [
    `Video: "${tutorial.videoTitle}"`,
    `Breakdown title: "${tutorial.title}"`,
    tutorial.summary ? `Summary: ${tutorial.summary}` : "",
    tutorial.transcript ? `\nTRANSCRIPT:\n${tutorial.transcript}` : "",
    `\nBREAKDOWN CONTENT:\n${tutorial.steps.map((s: any, i: number) => `[${i + 1}] ${s.tag}: ${s.title}\n${s.blocks.map((b: any) => b.html || b.code || "").join("\n")}`).join("\n\n")}`,
  ].filter(Boolean).join("\n");

  const systemPrompt = `You have access to a video breakdown and its full transcript. Answer the user's question based on this content. Be direct and specific. Reference timestamps when relevant. If the answer isn't in the content, say so.\n\n${context}`;

  const ai = new GoogleGenAI({ apiKey });
  const contents = [
    { role: "user" as const, parts: [{ text: systemPrompt }] },
    { role: "model" as const, parts: [{ text: "Understood. I have the full breakdown and transcript. Ask me anything about this video." }] },
    ...history.map((h) => ({
      role: (h.role === "user" ? "user" : "model") as "user" | "model",
      parts: [{ text: h.text }],
    })),
    { role: "user" as const, parts: [{ text: message }] },
  ];

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents,
    });

    const reply = response.text || "No response generated.";

    // Save conversation
    const id = convId || crypto.randomUUID().slice(0, 8);
    const allMessages = [...history, { role: "user", text: message }, { role: "model", text: reply }];
    const conv = {
      id,
      videoId,
      parentId: parentId || null,
      messages: allMessages,
      createdAt: Date.now(),
    };
    await kv.put(`chat:${videoId}:${id}`, JSON.stringify(conv), { expirationTtl: TTL_SECONDS });

    // Update index
    const indexRaw = await kv.get(`chat:${videoId}:index`);
    const index: { id: string; preview: string; messageCount: number; createdAt: number; parentId?: string }[] =
      indexRaw ? JSON.parse(indexRaw) : [];
    const existing = index.findIndex((c) => c.id === id);
    const entry = {
      id,
      preview: message.slice(0, 80),
      messageCount: allMessages.length,
      createdAt: existing >= 0 ? index[existing].createdAt : Date.now(),
      parentId: parentId || undefined,
    };
    if (existing >= 0) {
      index[existing] = entry;
    } else {
      index.unshift(entry);
    }
    await kv.put(`chat:${videoId}:index`, JSON.stringify(index.slice(0, 50)), { expirationTtl: TTL_SECONDS });

    return json({ reply, convId: id });
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Chat failed" }, 500);
  }
}


async function langfuseTrace(
  env: Env,
  opts: {
    traceId: string;
    name: string;
    input: unknown;
    output: unknown;
    model: string;
    startTime: string;
    endTime: string;
    metadata?: Record<string, unknown>;
    modelParameters?: Record<string, unknown>;
    usage?: { input?: number; output?: number; total?: number };
  },
): Promise<void> {
  const { LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY, LANGFUSE_BASE_URL } = env;
  if (!LANGFUSE_SECRET_KEY || !LANGFUSE_PUBLIC_KEY || !LANGFUSE_BASE_URL) return;

  const genId = `gen-${opts.traceId}`;
  const payload = {
    batch: [
      {
        id: crypto.randomUUID(),
        type: "trace-create",
        timestamp: opts.startTime,
        body: {
          id: opts.traceId,
          name: opts.name,
          input: opts.input,
          output: opts.output,
          metadata: opts.metadata,
        },
      },
      {
        id: crypto.randomUUID(),
        type: "generation-create",
        timestamp: opts.startTime,
        body: {
          id: genId,
          traceId: opts.traceId,
          name: `${opts.model} generation`,
          model: opts.model,
          input: opts.input,
          output: opts.output,
          startTime: opts.startTime,
          endTime: opts.endTime,
          usage: opts.usage,
          modelParameters: opts.modelParameters,
          metadata: opts.metadata,
        },
      },
    ],
  };

  try {
    const res = await fetch(`${LANGFUSE_BASE_URL}/api/public/ingestion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}`)}`,
      },
      body: JSON.stringify(payload),
    });
    const body = await res.text();
    console.log(`Langfuse trace ${res.status}: ${body}`);
  } catch (err) {
    console.error("Langfuse trace failed:", err instanceof Error ? err.message : err);
  }
}

async function getVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
    );
    const data = (await res.json()) as { title?: string };
    return data.title || "Untitled Video";
  } catch {
    return "Untitled Video";
  }
}

function buildPrompt(videoTitle: string): string {
  return `You're a cynical tech writer who values people's time. Someone sent you a video. You don't want to watch it either, but you did, and now you're going to save everyone else the trouble.

Your job: rip through the video, extract what's actually useful, call out the bullshit, and present it as a visual, scannable breakdown that takes 2 minutes to read instead of 20 minutes to watch.

Video title: "${videoTitle}"

## FORMAT

Each block: { type: "any string", html: "raw HTML with inline styles", caption?: "optional" }
Special: { type: "code", language: "...", code: "..." } for code blocks.
Special: { type: "screenshot", timestamp: 123, caption: "..." } for video seek buttons.

Everything else is your HTML. No templates, no components. You decide the layout.

## COLORS (CSS vars for dark/light mode)

Use hsl(var(--fd-foreground)) for body text (NOT --fd-muted-foreground, that's too faded). Use hsl(var(--fd-muted-foreground)) ONLY for labels/captions. Other vars: hsl(var(--fd-border)), hsl(var(--fd-primary)), hsl(var(--fd-card)), hsl(var(--fd-muted)). Opacity: hsl(var(--fd-primary) / 0.15). Fixed colors fine: #22c55e #ef4444 #f59e0b #3b82f6.

## STRUCTURE

- 5-15 sections chronologically, no timestamp gaps. endSeconds = next startSeconds.
- tagType: "intro" | "concept" | "setup" | "action"
- title: SHORT (under 60 chars). Descriptive, not meta. Never mention "breakdown", "cynical", "honest", "brutal" in the title. Just say what the video is about.
- summary: 2-4 SHORT sentences. Use <br> between sentences for line breaks. Is this worth my time? What's the actual point? Don't be polite.
- category: ONE word for the topic niche. Pick from existing: "AI", "Web Dev", "DevOps", "Design", "Data", "Security", "Mobile", "Gaming", "Hardware", "Cooking", "Finance", "Music", "Science", "Productivity". Only create a new category if none fit. Be conservative.
- transcript: Full transcript of what's said in the video. Include timestamps. Format: "0:00 - Speaker says this thing.\n0:45 - Then they explain that." Capture ALL dialogue, not just highlights.
- incentiveAnalysis: Short HTML (3-5 sentences) assessing whether to trust this creator. Skin-in-the-game analysis: is the video topic their PRIMARY expertise with real competitive stakes (coaches whose athletes must perform, professionals whose clients can sue, experts whose peers fact-check them), or a SECONDARY content-creator play monetized via ads/affiliates/supplements/courses where bad advice still gets views? Note red flags: selling the thing they're teaching, undisclosed sponsors, credentials that don't match claims. Classic contrast: rugby strength coach teaching hypertrophy has skin in the game (athletes must win matches) vs fitness influencer selling protein (affiliate revenue regardless of results). Be cynical and direct. Start with a color-coded verdict: "<strong style=\\"color:#22c55e\\">High trust:</strong>", "<strong style=\\"color:#f59e0b\\">Mixed:</strong>", or "<strong style=\\"color:#ef4444\\">Low trust:</strong>" - then the reasoning. Use <br> between sentences.

## OUTPUT (return ONLY valid JSON):
{
  "title": "Short Descriptive Title About The Topic",
  "category": "AI",
  "summary": "First sentence about what this is.<br>Second sentence about whether it's worth watching.<br>Third sentence with the cynical take.",
  "transcript": "0:00 - Full transcript with timestamps...",
  "incentiveAnalysis": "<strong style=\\"color:#f59e0b\\">Mixed:</strong> The creator is a full-time YouTuber whose income comes from ad revenue and sponsored segments.<br>Their main expertise is making videos about X, not actually doing X at a competitive level.<br>The advice is directionally useful but optimized for watch-time, not results.",
  "steps": [{ "startSeconds": 0, "endSeconds": 120, "tag": "Label", "tagType": "intro", "title": "...", "blocks": [{ "type": "...", "html": "..." }] }]
}`;
}
