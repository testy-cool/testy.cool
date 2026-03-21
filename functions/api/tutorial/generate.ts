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
  FRAME_EXTRACTOR_URL?: string;
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

    const text = response.text;
    if (!text) return json({ error: "Empty response from Gemini" }, 502);

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

    // 3b. Extract frames for screenshot blocks (non-blocking)
    await enrichWithFrames(tutorial, context.env.FRAME_EXTRACTOR_URL);

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

async function enrichWithFrames(
  tutorial: { videoId: string; steps: { blocks: { type: string; timestamp?: number; frameData?: string }[] }[] },
  frameExtractorUrl?: string,
): Promise<void> {
  try {
    // Collect all screenshot timestamps
    const screenshotBlocks: { stepIdx: number; blockIdx: number; timestamp: number }[] = [];
    for (let si = 0; si < tutorial.steps.length; si++) {
      const step = tutorial.steps[si];
      for (let bi = 0; bi < step.blocks.length; bi++) {
        const block = step.blocks[bi];
        if (block.type === "screenshot" && typeof block.timestamp === "number") {
          screenshotBlocks.push({ stepIdx: si, blockIdx: bi, timestamp: block.timestamp });
        }
      }
    }

    if (screenshotBlocks.length === 0) return;

    const baseUrl = (frameExtractorUrl || "https://frames.voidxd.cloud").replace(/\/$/, "");
    const res = await fetch(`${baseUrl}/extract-frames`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        videoId: tutorial.videoId,
        timestamps: screenshotBlocks.map((b) => b.timestamp),
      }),
      signal: AbortSignal.timeout(90_000),
    });

    if (!res.ok) {
      console.error(`Frame extractor returned ${res.status}: ${await res.text().catch(() => "")}`);
      return;
    }

    const data = (await res.json()) as { frames?: { timestamp: number; base64: string }[] };
    if (!data.frames || !Array.isArray(data.frames)) return;

    // Build a lookup by timestamp
    const frameMap = new Map<number, string>();
    for (const f of data.frames) {
      if (f.base64) frameMap.set(f.timestamp, f.base64);
    }

    // Merge back into blocks
    for (const sb of screenshotBlocks) {
      const frameData = frameMap.get(sb.timestamp);
      if (frameData) {
        tutorial.steps[sb.stepIdx].blocks[sb.blockIdx].frameData = frameData;
      }
    }

    console.log(`Enriched ${frameMap.size}/${screenshotBlocks.length} screenshot blocks with frames`);
  } catch (err) {
    console.error("Frame extraction failed (non-fatal):", err instanceof Error ? err.message : err);
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
  return `You are an expert technical writer creating an interactive scroll-synced video tutorial.

Video title: "${videoTitle}"

Watch this video and create a structured, richly illustrated tutorial from it.

## DESIGN SYSTEM

You have these block types to build with. Use them liberally to create a visually rich, scannable experience - NOT walls of text.

### Block types (use in the "blocks" array):

1. **paragraph** - Running text. Use HTML: <strong>, <code>, <em>. Keep paragraphs SHORT (2-4 sentences max). Break up ideas into multiple paragraphs rather than one long one.

2. **screenshot** - Visual reference from the video. Use these HEAVILY (8-15 per tutorial). Every time the video shows something visual - a UI, a diagram, terminal output, a code editor, a browser, a config screen, an architecture diagram, a comparison, a result - add a screenshot block. These get auto-populated with actual video frames. The reader should be able to understand the tutorial just by scanning the screenshots and their captions.
   Fields: timestamp (integer seconds), caption (what's shown - be specific)

3. **code** - Code blocks for any code shown or mentioned.
   Fields: language (string), code (string)

4. **concept** - Callout box for important ideas, warnings, or "here's how this actually works" explanations. Use for architecture decisions, trade-offs, gotchas.
   Fields: title (string), html (string with <strong>, <code>, <em>)

5. **tldr** - Your editorial opinion on a section. Cynical, honest, useful. "This part matters because..." or "Skip this, it's filler." or "The creator is wrong here, actually..."
   Fields: html (string)

6. **list** - Bullet points for steps, comparisons, feature lists. Each item can use <strong> and <code>.
   Fields: items (string array)

7. **flow** - Visual pipeline/data flow diagram. Use whenever the video describes a sequence, pipeline, data flow, or process. Shows steps as boxes connected by arrows.
   Fields: steps (string array - each step is a short label), caption (optional string)
   Example: { "type": "flow", "caption": "Request lifecycle", "steps": ["Client", "CDN", "Load Balancer", "API Server", "Database"] }

8. **comparison** - Visual comparison table. Use for feature comparisons, before/after, trade-offs, pros/cons, "X vs Y" discussions.
   Fields: headers (string array), rows (array of string arrays), caption (optional string)
   Example: { "type": "comparison", "caption": "SSR vs SSG", "headers": ["", "SSR", "SSG"], "rows": [["Speed", "Slower TTFB", "Instant"], ["SEO", "Full", "Full"], ["Data", "Real-time", "Build-time"]] }

9. **architecture** - Layered architecture diagram. Use when the video discusses system architecture, tech stacks, or how components relate across layers. Shows layers top-to-bottom with items in each.
   Fields: layers (array of { name: string, items: string[] }), caption (optional string)
   Example: { "type": "architecture", "caption": "Full stack", "layers": [{ "name": "Frontend", "items": ["React", "TailwindCSS"] }, { "name": "API", "items": ["Express", "GraphQL"] }, { "name": "Storage", "items": ["PostgreSQL", "Redis", "S3"] }] }

## CONTENT RULES

- Group into 5-15 logical sections depending on video length
- Each section = ONE topic, step, or concept
- Extract ALL technical details, steps, code, and explanations - don't summarize away the substance
- ILLUSTRATE don't narrate. Use flow, comparison, and architecture blocks to SHOW relationships and processes instead of describing them in paragraphs. If the video says "data flows from X to Y to Z", use a flow block. If it compares options, use a comparison table. If it shows a tech stack, use an architecture block.
- Use screenshots HEAVILY (8-15 per tutorial) for anything shown on screen.
- Alternate block types constantly. Never have 3+ paragraphs in a row. Break them up with visual blocks, screenshots, lists, concepts, code. The reader's eye should bounce between text and visuals.
- tagType must be exactly one of: "intro", "concept", "setup", "action"
- startSeconds/endSeconds must be integers matching the actual video timeline
- Sections must cover the entire video chronologically with no timestamp gaps
- endSeconds of one step = startSeconds of the next

## EDITORIAL VOICE

- Be cynical and honest. If a section is bullshit, say so. If the creator is wrong, say so. If there's a better way, name it.
- Call out outdated techniques, bad practices, marketing disguised as education, and claims that don't hold up. Fact-check with grounding when possible.
- Filler gets gutted. If 3 minutes could be 2 sentences, compress it.
- If something is genuinely good, give credit - but don't be nice for the sake of it.
- Your opinions go in "tldr" or "concept" blocks. Keep them sharp.

## SUMMARY (the "summary" field)

Write 5-10 sentences. This is the reader's "should I spend my time on this?" filter. Be specific and cynical:
- What is this video actually about (not what the title claims)?
- Is the creator competent or winging it?
- What's genuinely useful vs filler/marketing?
- What's the ONE thing worth taking away?
- Who should watch this and who should skip it?
- Are there better alternatives for learning this topic?
No diplomacy. No "overall this is a great video." Be real.

## OUTPUT FORMAT (return ONLY valid JSON):
{
  "title": "Tutorial title",
  "summary": "5-10 sentence cynical assessment...",
  "steps": [
    {
      "startSeconds": 0,
      "endSeconds": 33,
      "tag": "Short Label",
      "tagType": "intro",
      "title": "Section heading",
      "blocks": [
        { "type": "screenshot", "timestamp": 5, "caption": "What the viewer sees on screen at this moment" },
        { "type": "paragraph", "html": "Short paragraph with <strong>bold</strong> and <code>code</code>" },
        { "type": "screenshot", "timestamp": 18, "caption": "Another visual from the video" },
        { "type": "concept", "title": "Why This Matters", "html": "Explanation of the key idea" },
        { "type": "flow", "caption": "Pipeline", "steps": ["Input", "Process", "Output"] },
        { "type": "code", "language": "bash", "code": "actual code from the video" },
        { "type": "comparison", "headers": ["Feature", "Before", "After"], "rows": [["Speed", "Slow", "Fast"]] },
        { "type": "architecture", "layers": [{ "name": "Frontend", "items": ["React"] }, { "name": "Backend", "items": ["Node.js", "Redis"] }] },
        { "type": "tldr", "html": "Your honest take on this section" },
        { "type": "list", "items": ["<strong>Item 1:</strong> detail", "Item 2: detail"] }
      ]
    }
  ]
}`;
}
