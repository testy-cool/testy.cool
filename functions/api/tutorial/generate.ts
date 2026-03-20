import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3-flash-preview";
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MAX_RECENT = 20;
const RECENT_KEY = "recent_tutorials";

interface Env {
  GEMINI_API_KEY: string;
  PANTRY_CACHE: KVNamespace;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// GET: list recent tutorials or load a specific cached tutorial
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

  if (videoId) {
    const raw = await kv.get(`tutorial:${videoId}`);
    return json({ tutorial: raw ? JSON.parse(raw) : null });
  }

  return json({ error: "Missing action or videoId" }, 400);
};

// POST: generate tutorial (returns cached if available)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const apiKey = context.env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: "Gemini API key not configured" }, 502);

  const kv = context.env.PANTRY_CACHE;
  if (!kv) return json({ error: "KV not configured" }, 502);

  let body: { videoId: string };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { videoId } = body;
  if (!videoId || typeof videoId !== "string") {
    return json({ error: "Missing videoId" }, 400);
  }

  // Validate video ID format
  const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
  if (!VIDEO_ID_REGEX.test(videoId)) {
    return json({ error: "Invalid video ID format" }, 400);
  }

  // Check cache
  const cached = await kv.get(`tutorial:${videoId}`);
  if (cached) {
    const cachedTutorial = JSON.parse(cached);
    // Don't return broken cached tutorials - delete and regenerate
    if (!cachedTutorial.steps || cachedTutorial.steps.length === 0) {
      await kv.delete(`tutorial:${videoId}`);
    } else {
      return json({ tutorial: cachedTutorial, cached: true });
    }
  }

  // Rate limit (skip for cached hits above)
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

  // Generation lock to prevent duplicate Gemini calls
  const lockKey = `generating:${videoId}`;
  const existingLock = await kv.get(lockKey);
  if (existingLock) {
    return json(
      { error: "Generation already in progress for this video. Please wait and try again." },
      409,
    );
  }
  await kv.put(lockKey, "1", { expirationTtl: 120 });

  try {
    // 1. Get video title via oEmbed
    const videoTitle = await getVideoTitle(videoId);

    // 2. Send YouTube video directly to Gemini for analysis
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(videoTitle);

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
            { text: prompt },
          ],
        },
      ],
      config: { responseMimeType: "application/json" },
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

    // 3. Cache result
    await kv.put(`tutorial:${videoId}`, JSON.stringify(tutorial), {
      expirationTtl: TTL_SECONDS,
    });

    // Delete generation lock
    await kv.delete(lockKey);

    // 4. Update recent list
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

    return json({ tutorial, cached: false });
  } catch (e: unknown) {
    await kv.delete(lockKey);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return json({ error: msg }, 500);
  }
};

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

Watch this video and create a structured, highly detailed tutorial from it.

RULES:
- Group the video into logical sections (5-15 sections depending on video length)
- Each section covers ONE topic, step, or concept
- Do NOT summarize heavily - extract ALL technical details, steps, explanations, and code shown or mentioned
- Format any code shown or mentioned as code blocks with the correct language tag
- Add a "tldr" block for sections that are conceptually dense
- Add "concept" blocks for important ideas or notions that deserve a callout box
- Add "screenshot" blocks whenever the video shows something visually important that the reader should SEE: diagrams, UI screenshots, architecture visuals, terminal output, code on screen, comparison demos, dashboards, graphs, workflow illustrations, etc. Include at least 2-5 screenshots per tutorial. Place them right where the visual appears in the video timeline.
- tagType must be exactly one of: "intro", "concept", "setup", "action"
- startSeconds and endSeconds must be integers matching the actual video timeline
- Sections must cover the entire video chronologically with no timestamp gaps
- endSeconds of one step should equal startSeconds of the next step
- In HTML content, use <strong> for bold, <code> for inline code, <em> for emphasis

OUTPUT FORMAT (return ONLY valid JSON):
{
  "title": "Tutorial title",
  "steps": [
    {
      "startSeconds": 0,
      "endSeconds": 33,
      "tag": "Short Label",
      "tagType": "intro",
      "title": "Section heading",
      "blocks": [
        { "type": "paragraph", "html": "Text with <strong>bold</strong> and <code>code</code>" },
        { "type": "code", "language": "bash", "code": "actual code from the video" },
        { "type": "screenshot", "timestamp": 25, "caption": "Brief description of what is shown on screen" },
        { "type": "tldr", "html": "Quick summary of this section" },
        { "type": "concept", "title": "Concept Name", "html": "Explanation of the key idea" },
        { "type": "list", "items": ["<strong>Item 1:</strong> detail", "Item 2: detail"] }
      ]
    }
  ]
}`;
}
