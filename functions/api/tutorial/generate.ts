import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3-flash-preview";
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

  if (videoId) {
    const raw = await kv.get(`tutorial:${videoId}`);
    return json({ tutorial: raw ? JSON.parse(raw) : null });
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

  let body: { videoId: string; force?: boolean };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { videoId, force } = body;
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
  if (rateLimitCount >= 30) {
    return json(
      { error: "Rate limit exceeded. Max 30 generations per hour." },
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
      return json(
        { error: "Generation already in progress for this video. Please wait and try again." },
        409,
      );
    }
  }
  await kv.put(lockKey, "1", { expirationTtl: 120 });

  try {
    // 1. Get video title via oEmbed
    const videoTitle = await getVideoTitle(videoId);

    // 2. Determine prompt: check KV for custom prompt, fall back to hardcoded
    const storedPrompt = await kv.get(PROMPT_KEY);
    const prompt = storedPrompt || buildPrompt(videoTitle);
    // If using stored prompt, inject the video title
    const finalPrompt = storedPrompt
      ? storedPrompt.replace(/\{videoTitle\}/g, videoTitle)
      : prompt;

    // 3. Send YouTube video directly to Gemini for analysis
    const ai = new GoogleGenAI({ apiKey });
    const genStartTime = new Date().toISOString();

    const response = await ai.models.generateContent({
      model: MODEL,
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
    if (!text) return json({ error: "Empty response from Gemini" }, 502);

    // Langfuse trace
    const usageMeta = response.usageMetadata;
    await langfuseTrace(context.env, {
      traceId: `tut-${videoId}-${Date.now()}`,
      name: `tutorial:${videoId}`,
      input: { videoId, videoTitle, promptLength: finalPrompt.length },
      output: { responseLength: text.length },
      model: MODEL,
      startTime: genStartTime,
      endTime: genEndTime,
      metadata: { videoTitle, force: !!force },
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
      return json({ error: "Failed to parse tutorial data" }, 502);
    }

    const tutorial = {
      videoId,
      videoTitle,
      title: tutorialData.title || videoTitle,
      summary: (tutorialData as any).summary || "",
      steps: tutorialData.steps || [],
      generatedAt: Date.now(),
    };

    // Validate tutorial has steps before caching
    if (!tutorial.steps || (tutorial.steps as unknown[]).length === 0) {
      await kv.delete(lockKey);
      return json(
        { error: "Failed to generate tutorial content. Please try again." },
        500,
      );
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
      // Clean up old version keys
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

    // Store main key (backward compat)
    await kv.put(`tutorial:${videoId}`, JSON.stringify(tutorial), {
      expirationTtl: TTL_SECONDS,
    });

    // Delete generation lock
    await kv.delete(lockKey);

    // 5. Update recent list
    const raw = await kv.get(RECENT_KEY);
    const recent: { videoId: string }[] = raw ? JSON.parse(raw) : [];
    const summary = {
      videoId,
      title: tutorial.title,
      stepCount: (tutorial.steps as unknown[]).length,
      timestamp: Date.now(),
    };
    const updated = [
      summary,
      ...recent.filter((t) => t.videoId !== videoId),
    ].slice(0, MAX_RECENT);
    await kv.put(RECENT_KEY, JSON.stringify(updated));

    return json({ tutorial, cached: false, version: newVersion });
  } catch (e: unknown) {
    await kv.delete(lockKey);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return json({ error: msg }, 500);
  }
};


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
  return `Watch this video and create an illustrated, scannable breakdown.

Video title: "${videoTitle}"

## HOW IT WORKS

Each step has a "blocks" array. Each block has a "type" (any string you want) and an "html" field with your content. You write raw HTML with inline styles. You control all the layout, typography, and visuals. There are no predefined components — you decide how to present each piece of information.

Two special block types:
- **code** — { type: "code", language: "...", code: "..." } — rendered as a syntax-highlighted code block
- **screenshot** — { type: "screenshot", timestamp: 123, caption: "..." } — rendered as a clickable seek button (no image)

Everything else: { type: "anything", html: "your HTML here", caption?: "optional label above" }

## DESIGN TOKENS

Use these CSS variables in inline styles for dark/light mode:
- \`hsl(var(--fd-foreground))\` text, \`hsl(var(--fd-muted-foreground))\` secondary
- \`hsl(var(--fd-border))\` borders, \`hsl(var(--fd-primary))\` accent
- \`hsl(var(--fd-card))\` card bg, \`hsl(var(--fd-muted))\` muted bg
- Opacity: \`hsl(var(--fd-primary) / 0.15)\`
- Fixed colors when semantic: #22c55e green, #ef4444 red, #f59e0b amber, #3b82f6 blue

You have full HTML, SVG, CSS grid, flexbox, tables, positioning. Build bar charts, flow diagrams, comparison grids, architecture layouts, annotated visuals — whatever explains the concept best.

## RULES

- 5-15 sections, each one topic. Cover the entire video chronologically, no gaps.
- tagType: "intro" | "concept" | "setup" | "action"
- endSeconds of one step = startSeconds of the next
- Extract all substance — code, config, commands, architecture.
- Be cynical, honest, sharp. Gut the filler. Fact-check. Credit what's good.

## OUTPUT FORMAT (return ONLY valid JSON):
{
  "title": "Tutorial title",
  "summary": "3-5 sentences. Worth watching? What's useful? Who should skip?",
  "steps": [
    {
      "startSeconds": 0,
      "endSeconds": 120,
      "tag": "Label",
      "tagType": "intro",
      "title": "Section heading",
      "blocks": [
        { "type": "text", "html": "<p style='...'>Your content</p>" },
        { "type": "diagram", "html": "<div style='...'>SVG or HTML diagram</div>", "caption": "How it works" },
        { "type": "code", "language": "bash", "code": "npm install ..." },
        { "type": "comparison", "html": "<table style='...'>...</table>" },
        { "type": "opinion", "html": "<p style='...'>Your honest take</p>" },
        { "type": "screenshot", "timestamp": 45, "caption": "Key moment" }
      ]
    }
  ]
}`;
}
