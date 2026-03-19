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

  // Check cache
  const cached = await kv.get(`tutorial:${videoId}`);
  if (cached) {
    return json({ tutorial: JSON.parse(cached), cached: true });
  }

  try {
    // 1. Get video title
    const videoTitle = await getVideoTitle(videoId);

    // 2. Fetch timestamped transcript
    const transcript = await getTimestampedTranscript(videoId);
    if (!transcript) {
      return json({ error: "No captions available for this video" }, 404);
    }

    // 3. Generate tutorial via Gemini
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(transcript, videoTitle);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
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

    // 4. Cache result
    await kv.put(`tutorial:${videoId}`, JSON.stringify(tutorial), {
      expirationTtl: TTL_SECONDS,
    });

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

    return json({ tutorial, cached: false });
  } catch (e: unknown) {
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

async function getTimestampedTranscript(
  videoId: string,
): Promise<string | null> {
  // Fetch YouTube watch page to extract innertube API key
  const watchRes = await fetch(
    `https://www.youtube.com/watch?v=${videoId}`,
  );
  const html = await watchRes.text();
  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  if (!apiKeyMatch) return null;

  // Get captions via innertube player endpoint
  const playerRes = await fetch(
    `https://www.youtube.com/youtubei/v1/player?key=${apiKeyMatch[1]}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        context: {
          client: { clientName: "ANDROID", clientVersion: "20.10.38" },
        },
        videoId,
      }),
    },
  );
  const playerData = (await playerRes.json()) as {
    captions?: {
      playerCaptionsTracklistRenderer?: {
        captionTracks?: { languageCode: string; baseUrl: string }[];
      };
    };
  };
  const tracks =
    playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks?.length) return null;

  const enTrack =
    tracks.find((t) => t.languageCode === "en") || tracks[0];
  const captionRes = await fetch(
    enTrack.baseUrl.replace(/&fmt=\w+$/, ""),
  );
  const xml = await captionRes.text();
  if (!xml) return null;

  // Parse XML into timestamped segments
  const segments: { start: number; text: string }[] = [];
  const matches = [
    ...xml.matchAll(/<text start="([^"]*)"[^>]*>([^<]*)<\/text>/g),
  ];

  for (const m of matches) {
    const start = parseFloat(m[1]);
    const text = m[2]
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim();
    if (text) segments.push({ start, text });
  }

  if (segments.length === 0) return null;

  // Group into ~15-second chunks for cleaner input
  const chunks: string[] = [];
  let chunkStart = segments[0].start;
  let chunkTexts: string[] = [];

  for (const seg of segments) {
    if (seg.start - chunkStart >= 15 && chunkTexts.length > 0) {
      const mm = String(Math.floor(chunkStart / 60)).padStart(2, "0");
      const ss = String(Math.floor(chunkStart % 60)).padStart(2, "0");
      chunks.push(`[${mm}:${ss}] ${chunkTexts.join(" ")}`);
      chunkStart = seg.start;
      chunkTexts = [];
    }
    chunkTexts.push(seg.text);
  }

  // Last chunk
  if (chunkTexts.length > 0) {
    const mm = String(Math.floor(chunkStart / 60)).padStart(2, "0");
    const ss = String(Math.floor(chunkStart % 60)).padStart(2, "0");
    chunks.push(`[${mm}:${ss}] ${chunkTexts.join(" ")}`);
  }

  return chunks.join("\n");
}

function buildPrompt(transcript: string, videoTitle: string): string {
  return `You are an expert technical writer creating an interactive scroll-synced video tutorial.

Video title: "${videoTitle}"

Convert this timestamped transcript into a structured, highly detailed tutorial.

RULES:
- Group transcript into logical sections (5-15 sections depending on video length)
- Each section covers ONE topic, step, or concept
- Do NOT summarize heavily - extract ALL technical details, steps, explanations, and code
- Format any code mentioned in the video as code blocks with the correct language tag
- Add a "tldr" block for sections that are conceptually dense
- Add "concept" blocks for important ideas or notions that deserve a callout box
- tagType must be exactly one of: "intro", "concept", "setup", "action"
- startSeconds and endSeconds must be integers matching the transcript timestamps
- Sections must cover the entire video chronologically with no timestamp gaps
- endSeconds of one step should equal startSeconds of the next step
- In HTML content, use <strong> for bold, <code> for inline code, <em> for emphasis

OUTPUT FORMAT (return ONLY valid JSON, no markdown fencing):
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
        { "type": "tldr", "html": "Quick summary of this section" },
        { "type": "concept", "title": "Concept Name", "html": "Explanation of the key idea" },
        { "type": "list", "items": ["<strong>Item 1:</strong> detail", "Item 2: detail"] }
      ]
    }
  ]
}

TRANSCRIPT:
${transcript}`;
}
