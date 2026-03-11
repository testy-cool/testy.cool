# Channel Pantry Deployment — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy the Channel Pantry app at `testy.cool/tools/channel-pantry` with API keys hidden behind Cloudflare Pages Functions.

**Architecture:** Three Cloudflare Pages Functions proxy Gemini, YouTube Data API, and YouTube transcript requests. A Next.js `"use client"` page mounts the pantry React components. Service layer calls `/api/pantry/*` instead of using keys directly.

**Tech Stack:** Cloudflare Pages Functions (ES module workers), Next.js 15, React 19, `@google/genai` (npm, server-side only), Tailwind v4 with fumadocs tokens.

**Spec:** `docs/superpowers/specs/2026-03-11-channel-pantry-deploy-design.md`

**Source app:** `F:\code\recipe-ingredient-resolver` (reference only — copy code, don't import)

---

## Chunk 1: Cloudflare Pages Functions

### Task 1: Create Gemini proxy function

**Files:**
- Create: `functions/api/pantry/gemini.ts`

- [ ] **Step 1: Create the function file**

```ts
// functions/api/pantry/gemini.ts
import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3-flash-preview';
const MAX_BODY = 16_384; // 16KB

interface Env {
  GEMINI_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const key = context.env.GEMINI_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 502 });

  const raw = await context.request.text();
  if (raw.length > MAX_BODY) {
    return new Response(JSON.stringify({ error: 'Request too large' }), { status: 413 });
  }

  let body: { contents: string; responseMimeType?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  if (!body.contents || typeof body.contents !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing contents field' }), { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: body.contents,
      config: body.responseMimeType ? { responseMimeType: body.responseMimeType } : undefined,
    });

    return new Response(JSON.stringify({
      text: response.text,
      usageMetadata: response.usageMetadata,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Gemini error' }), { status: 502 });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/pantry/gemini.ts
git commit -m "feat(pantry): add Gemini proxy CF function"
```

### Task 2: Create YouTube Data API proxy function

**Files:**
- Create: `functions/api/pantry/youtube.ts`

- [ ] **Step 1: Create the function file**

```ts
// functions/api/pantry/youtube.ts
const YT_API = 'https://www.googleapis.com/youtube/v3';

interface Env {
  YOUTUBE_API_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const key = context.env.YOUTUBE_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: 'YouTube API key not configured' }), { status: 502 });

  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');

  let ytUrl: string;

  switch (action) {
    case 'channelInfo': {
      const handle = url.searchParams.get('handle');
      if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
      const params = new URLSearchParams({ part: 'contentDetails,snippet', key });
      if (handle.startsWith('@')) params.set('forHandle', handle);
      else if (handle.startsWith('UC')) params.set('id', handle);
      else params.set('forHandle', '@' + handle);
      ytUrl = `${YT_API}/channels?${params}`;
      break;
    }
    case 'videos': {
      const playlistId = url.searchParams.get('playlistId');
      const maxResults = url.searchParams.get('maxResults') || '20';
      if (!playlistId) return new Response(JSON.stringify({ error: 'Missing playlistId' }), { status: 400 });
      const params = new URLSearchParams({
        part: 'snippet',
        playlistId,
        maxResults: String(Math.min(50, Number(maxResults))),
        key,
      });
      const pageToken = url.searchParams.get('pageToken');
      if (pageToken) params.set('pageToken', pageToken);
      ytUrl = `${YT_API}/playlistItems?${params}`;
      break;
    }
    case 'channelFromVideo': {
      const videoId = url.searchParams.get('videoId');
      if (!videoId) return new Response(JSON.stringify({ error: 'Missing videoId' }), { status: 400 });
      ytUrl = `${YT_API}/videos?${new URLSearchParams({ part: 'snippet', id: videoId, key })}`;
      break;
    }
    default:
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  }

  try {
    const res = await fetch(ytUrl);
    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'YouTube API error' }), { status: 502 });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/pantry/youtube.ts
git commit -m "feat(pantry): add YouTube Data API proxy CF function"
```

### Task 3: Create transcript proxy function

**Files:**
- Create: `functions/api/pantry/transcript.ts`

- [ ] **Step 1: Create the function file**

Ported from the Vite `transcriptProxyPlugin` in `F:\code\recipe-ingredient-resolver\vite.config.ts:6-77`. Uses Innertube ANDROID client to bypass CORS and POT tokens. Returns `{ text: string }` to match existing `youtubeService.ts` expectation (`data.text`).

```ts
// functions/api/pantry/transcript.ts
export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const videoId = url.searchParams.get('videoId') || url.searchParams.get('v');
  if (!videoId) {
    return new Response(JSON.stringify({ error: 'Missing videoId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    // Fetch YouTube page to get Innertube API key
    const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await watchRes.text();
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
    if (!apiKeyMatch) {
      return new Response(JSON.stringify({ error: 'Could not extract API key' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Use ANDROID client to get caption tracks (bypasses POT requirement)
    const playerRes = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKeyMatch[1]}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } },
        videoId,
      }),
    });
    const playerData = await playerRes.json() as any;
    const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!tracks || tracks.length === 0) {
      return new Response(JSON.stringify({ error: 'No captions available' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Pick English track or first available
    const enTrack = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];
    const captionRes = await fetch(enTrack.baseUrl.replace(/&fmt=\w+$/, ''));
    const xml = await captionRes.text();
    if (!xml) {
      return new Response(JSON.stringify({ error: 'Empty transcript' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Parse XML caption segments
    const text = [...xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)]
      .map(m => m[1])
      .join(' ')
      .replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    return new Response(JSON.stringify({ text }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
```

- [ ] **Step 2: Commit**

```bash
git add functions/api/pantry/transcript.ts
git commit -m "feat(pantry): add transcript proxy CF function"
```

### Task 4: Install `@google/genai` as dependency

The Gemini function needs the SDK at build time. CF Pages Functions bundling will pick it up.

**Files:**
- Modify: `package.json` (root)

- [ ] **Step 1: Install the dependency**

```bash
pnpm add @google/genai -w
```

The `-w` flag installs at workspace root, which is where CF Functions resolve from.

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add @google/genai for CF Functions"
```

---

## Chunk 2: Service Layer (lib files)

### Task 5: Create pantry types

**Files:**
- Create: `apps/web/lib/tools/channel-pantry/types.ts`

- [ ] **Step 1: Create the types file**

Copy from `F:\code\recipe-ingredient-resolver\src\types\pantry.ts` verbatim — no changes needed, all types are framework-agnostic.

```ts
// apps/web/lib/tools/channel-pantry/types.ts
export interface VideoInfo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
}

export interface ExtractedIngredient {
  name: string;
  category: FoodCategory;
}

export type FoodCategory =
  | 'Proteins'
  | 'Dairy & Eggs'
  | 'Vegetables'
  | 'Fruits'
  | 'Grains & Starches'
  | 'Spices & Seasonings'
  | 'Oils & Fats'
  | 'Sauces & Condiments'
  | 'Other';

export const FOOD_CATEGORIES: { name: FoodCategory; emoji: string }[] = [
  { name: 'Proteins', emoji: '🥩' },
  { name: 'Dairy & Eggs', emoji: '🥛' },
  { name: 'Vegetables', emoji: '🥬' },
  { name: 'Fruits', emoji: '🍎' },
  { name: 'Grains & Starches', emoji: '🌾' },
  { name: 'Spices & Seasonings', emoji: '🧂' },
  { name: 'Oils & Fats', emoji: '🫒' },
  { name: 'Sauces & Condiments', emoji: '🫙' },
  { name: 'Other', emoji: '📦' },
];

export type VideoExtractionStatus =
  | 'pending'
  | 'extracting_description'
  | 'fetching_transcript'
  | 'extracting_transcript'
  | 'done'
  | 'skipped'
  | 'error';

export interface VideoProgress {
  videoId: string;
  title: string;
  publishedAt?: string;
  status: VideoExtractionStatus;
  tier?: 'description' | 'transcript' | 'skipped';
  ingredients: ExtractedIngredient[];
}

export interface IngredientFrequency {
  name: string;
  category: FoodCategory;
  count: number;
  videoIds: string[];
}

export interface ChannelAnalysisResult {
  channelId: string;
  channelTitle: string;
  videoCount: number;
  videosAnalyzed: number;
  videosWithIngredients: number;
  ingredients: IngredientFrequency[];
  totalCost: number;
  elapsedMs: number;
  timestamp: number;
}

export interface CostAccumulator {
  promptTokens: number;
  outputTokens: number;
  totalCost: number;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/tools/channel-pantry/types.ts
git commit -m "feat(pantry): add pantry types"
```

### Task 6: Create cost tracker

**Files:**
- Create: `apps/web/lib/tools/channel-pantry/costTracker.ts`

- [ ] **Step 1: Create the file**

Copy from `F:\code\recipe-ingredient-resolver\src\services\costTracker.ts`. The only change is the import path for `CostAccumulator`.

```ts
// apps/web/lib/tools/channel-pantry/costTracker.ts
import type { CostAccumulator } from './types';

const INPUT_COST_PER_M = 0.15;
const OUTPUT_COST_PER_M = 0.60;

export function createCostTracker(): {
  track: (promptTokens: number, outputTokens: number) => void;
  get: () => CostAccumulator;
} {
  let acc: CostAccumulator = { promptTokens: 0, outputTokens: 0, totalCost: 0 };

  return {
    track(promptTokens: number, outputTokens: number) {
      acc.promptTokens += promptTokens;
      acc.outputTokens += outputTokens;
      acc.totalCost =
        (acc.promptTokens / 1_000_000) * INPUT_COST_PER_M +
        (acc.outputTokens / 1_000_000) * OUTPUT_COST_PER_M;
    },
    get() {
      return { ...acc };
    },
  };
}

/** Extract token counts from a proxy response and track them */
export function trackGeminiResponse(
  tracker: ReturnType<typeof createCostTracker>,
  response: { usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number } }
) {
  const prompt = response.usageMetadata?.promptTokenCount ?? 0;
  const output = response.usageMetadata?.candidatesTokenCount ?? 0;
  tracker.track(prompt, output);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/tools/channel-pantry/costTracker.ts
git commit -m "feat(pantry): add cost tracker"
```

### Task 7: Create YouTube service (proxy-based)

**Files:**
- Create: `apps/web/lib/tools/channel-pantry/youtubeService.ts`

- [ ] **Step 1: Create the file**

Rewritten from `F:\code\recipe-ingredient-resolver\src\services\youtubeService.ts`. All direct YouTube API calls replaced with `/api/pantry/youtube` proxy calls. `parseChannelInput` stays as-is (pure client-side parsing). `getTranscript` calls `/api/pantry/transcript` instead of the old Vite middleware path.

```ts
// apps/web/lib/tools/channel-pantry/youtubeService.ts
import type { VideoInfo } from './types';

/** Parse input into either { type: 'channel', value } or { type: 'video', videoId } */
export function parseChannelInput(input: string): { type: 'channel'; value: string } | { type: 'video'; videoId: string } {
  const trimmed = input.trim();
  if (trimmed.startsWith('@')) return { type: 'channel', value: trimmed };
  try {
    const url = new URL(trimmed);
    const path = url.pathname;
    const vParam = url.searchParams.get('v');
    if (vParam) return { type: 'video', videoId: vParam };
    const shortsMatch = path.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return { type: 'video', videoId: shortsMatch[1] };
    if (url.hostname === 'youtu.be') {
      const id = path.slice(1).split('/')[0];
      if (id.length === 11) return { type: 'video', videoId: id };
    }
    const handleMatch = path.match(/\/@([^/]+)/);
    if (handleMatch) return { type: 'channel', value: '@' + handleMatch[1] };
    const channelMatch = path.match(/\/channel\/([^/]+)/);
    if (channelMatch) return { type: 'channel', value: channelMatch[1] };
    const cMatch = path.match(/\/c\/([^/]+)/);
    if (cMatch) return { type: 'channel', value: '@' + cMatch[1] };
  } catch {}
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) return { type: 'channel', value: trimmed };
  if (/^[a-zA-Z0-9_.-]+$/.test(trimmed)) return { type: 'channel', value: '@' + trimmed };
  throw new Error('Could not parse channel or video from input: ' + trimmed);
}

/** Look up the channel that owns a video */
export async function getChannelFromVideo(videoId: string): Promise<string> {
  const res = await fetch(`/api/pantry/youtube?action=channelFromVideo&videoId=${encodeURIComponent(videoId)}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  if (!data.items?.length) throw new Error('Video not found');
  return data.items[0].snippet.channelId;
}

/** Resolve a handle or channel ID to channel info */
export async function getChannelInfo(handleOrId: string): Promise<{
  channelId: string;
  channelTitle: string;
  uploadsPlaylistId: string;
}> {
  const res = await fetch(`/api/pantry/youtube?action=channelInfo&handle=${encodeURIComponent(handleOrId)}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  if (!data.items?.length) throw new Error('Channel not found');

  const ch = data.items[0];
  return {
    channelId: ch.id,
    channelTitle: ch.snippet.title,
    uploadsPlaylistId: ch.contentDetails.relatedPlaylists.uploads,
  };
}

/** Fetch recent videos from an uploads playlist */
export async function getRecentVideos(
  uploadsPlaylistId: string,
  maxResults: number
): Promise<VideoInfo[]> {
  const all: VideoInfo[] = [];
  let pageToken: string | undefined;

  while (all.length < maxResults) {
    const params = new URLSearchParams({
      action: 'videos',
      playlistId: uploadsPlaylistId,
      maxResults: String(Math.min(50, maxResults - all.length)),
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`/api/pantry/youtube?${params}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (!data.items?.length) break;

    for (const item of data.items) {
      all.push({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
      });
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return all.slice(0, maxResults);
}

/** Fetch transcript for a video via the CF Function proxy */
export async function getTranscript(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/pantry/transcript?videoId=${encodeURIComponent(videoId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.text || null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/tools/channel-pantry/youtubeService.ts
git commit -m "feat(pantry): add YouTube service with proxy calls"
```

### Task 8: Create channel analyzer service (proxy-based)

**Files:**
- Create: `apps/web/lib/tools/channel-pantry/channelAnalyzerService.ts`

- [ ] **Step 1: Create the file**

Rewritten from `F:\code\recipe-ingredient-resolver\src\services\channelAnalyzerService.ts`. All `@google/genai` usage replaced with `fetch('/api/pantry/gemini')`. The `process.env.API_KEY` guard is removed. `trackGeminiResponse` now works on the proxy response shape.

```ts
// apps/web/lib/tools/channel-pantry/channelAnalyzerService.ts
import type {
  VideoInfo, VideoProgress, ExtractedIngredient,
  IngredientFrequency, CostAccumulator,
} from './types';
import { getTranscript } from './youtubeService';
import { createCostTracker, trackGeminiResponse } from './costTracker';

const EXTRACTION_PROMPT = `You are analyzing a cooking video. Extract ALL ingredients mentioned.

Return JSON: { "ingredients": [{ "name": "canonical ingredient name", "category": "one of: Proteins, Dairy & Eggs, Vegetables, Fruits, Grains & Starches, Spices & Seasonings, Oils & Fats, Sauces & Condiments, Other" }] }

Rules:
- Return canonical names only: "garlic" not "4 cloves minced garlic"
- No quantities, preparations, or brands
- If no ingredients found, return { "ingredients": [] }
- Include ALL ingredients, even basic ones like salt, water, oil`;

const DEDUP_PROMPT = `You have a list of ingredients collected from multiple cooking videos. Merge near-duplicates and confirm categories.

Rules:
- Merge: "garlic" + "fresh garlic" + "garlic cloves" → "garlic"
- Merge: "olive oil" + "extra virgin olive oil" → "olive oil"
- Keep distinct items separate: "green onion" vs "onion"
- Categories must be one of: Proteins, Dairy & Eggs, Vegetables, Fruits, Grains & Starches, Spices & Seasonings, Oils & Fats, Sauces & Condiments, Other

Input is a JSON array of { name, category, count, videoIds }.
Return the same structure with duplicates merged (combine counts and videoIds).`;

type ProgressCallback = (progress: VideoProgress) => void;

/** Call the Gemini proxy */
async function callGemini(
  contents: string,
  costTracker: ReturnType<typeof createCostTracker>,
  responseMimeType?: string
): Promise<{ text: string; usageMetadata?: any }> {
  const res = await fetch('/api/pantry/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents, responseMimeType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Gemini proxy error' }));
    throw new Error(err.error || 'Gemini proxy error');
  }
  const data = await res.json();
  trackGeminiResponse(costTracker, data);
  return data;
}

/** Extract ingredients from a single video using tiered approach */
async function extractFromVideo(
  video: VideoInfo,
  costTracker: ReturnType<typeof createCostTracker>,
  onProgress: ProgressCallback
): Promise<ExtractedIngredient[]> {
  // Tier 1: Try description
  onProgress({ videoId: video.videoId, title: video.title, publishedAt: video.publishedAt, status: 'extracting_description', ingredients: [] });

  const descResult = await tryExtract(video.description, costTracker);
  if (descResult.length > 0) {
    onProgress({ videoId: video.videoId, title: video.title, publishedAt: video.publishedAt, status: 'done', tier: 'description', ingredients: descResult });
    return descResult;
  }

  // Tier 2: Try transcript
  onProgress({ videoId: video.videoId, title: video.title, publishedAt: video.publishedAt, status: 'fetching_transcript', ingredients: [] });
  const transcript = await getTranscript(video.videoId);

  if (transcript && transcript.length > 50) {
    onProgress({ videoId: video.videoId, title: video.title, publishedAt: video.publishedAt, status: 'extracting_transcript', ingredients: [] });
    const transResult = await tryExtract(transcript, costTracker);
    if (transResult.length > 0) {
      onProgress({ videoId: video.videoId, title: video.title, publishedAt: video.publishedAt, status: 'done', tier: 'transcript', ingredients: transResult });
      return transResult;
    }
  }

  // Tier 3: Skip
  onProgress({ videoId: video.videoId, title: video.title, publishedAt: video.publishedAt, status: 'skipped', tier: 'skipped', ingredients: [] });
  return [];
}

/** Send text to Gemini for ingredient extraction */
async function tryExtract(
  text: string,
  costTracker: ReturnType<typeof createCostTracker>
): Promise<ExtractedIngredient[]> {
  if (!text || text.trim().length < 20) return [];

  try {
    const data = await callGemini(
      `${EXTRACTION_PROMPT}\n\nText to analyze:\n${text.slice(0, 8000)}`,
      costTracker,
      'application/json'
    );
    const parsed = JSON.parse(data.text);
    return (parsed.ingredients || []).filter(
      (i: any) => i.name && typeof i.name === 'string' && i.category
    );
  } catch {
    return [];
  }
}

/** Batch helper */
async function batchAsync<T>(items: T[], batchSize: number, fn: (item: T) => Promise<void>) {
  for (let i = 0; i < items.length; i += batchSize) {
    await Promise.all(items.slice(i, i + batchSize).map(fn));
  }
}

/** Aggregate ingredients across videos into frequency map */
function aggregate(
  videoResults: Map<string, ExtractedIngredient[]>
): IngredientFrequency[] {
  const freq = new Map<string, IngredientFrequency>();

  for (const [videoId, ingredients] of videoResults) {
    for (const ing of ingredients) {
      const key = ing.name.toLowerCase();
      const existing = freq.get(key);
      if (existing) {
        existing.count++;
        existing.videoIds.push(videoId);
      } else {
        freq.set(key, {
          name: ing.name,
          category: ing.category,
          count: 1,
          videoIds: [videoId],
        });
      }
    }
  }

  return Array.from(freq.values()).sort((a, b) => b.count - a.count);
}

/** Post-aggregation dedup via Gemini */
async function dedup(
  ingredients: IngredientFrequency[],
  costTracker: ReturnType<typeof createCostTracker>
): Promise<IngredientFrequency[]> {
  if (ingredients.length === 0) return [];

  try {
    const data = await callGemini(
      `${DEDUP_PROMPT}\n\n${JSON.stringify(ingredients)}`,
      costTracker,
      'application/json'
    );
    const parsed = JSON.parse(data.text);
    return (Array.isArray(parsed) ? parsed : parsed.ingredients || ingredients)
      .sort((a: IngredientFrequency, b: IngredientFrequency) => b.count - a.count);
  } catch {
    return ingredients;
  }
}

/** Main entry point: analyze a channel's videos */
export async function analyzeChannel(
  videos: VideoInfo[],
  onProgress: ProgressCallback,
  onCostUpdate: (cost: CostAccumulator) => void
): Promise<{ ingredients: IngredientFrequency[]; cost: CostAccumulator; videosWithIngredients: number }> {
  const costTracker = createCostTracker();
  const videoResults = new Map<string, ExtractedIngredient[]>();

  for (const v of videos) {
    onProgress({ videoId: v.videoId, title: v.title, publishedAt: v.publishedAt, status: 'pending', ingredients: [] });
  }

  await batchAsync(videos, 5, async (video) => {
    const ingredients = await extractFromVideo(video, costTracker, onProgress);
    videoResults.set(video.videoId, ingredients);
    onCostUpdate(costTracker.get());
  });

  const videosWithIngredients = Array.from(videoResults.values()).filter(v => v.length > 0).length;
  const aggregated = aggregate(videoResults);
  const deduped = await dedup(aggregated, costTracker);
  onCostUpdate(costTracker.get());

  return { ingredients: deduped, cost: costTracker.get(), videosWithIngredients };
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/lib/tools/channel-pantry/channelAnalyzerService.ts
git commit -m "feat(pantry): add channel analyzer service with proxy calls"
```

---

## Chunk 3: UI Components

### Task 9: Add CSS keyframes to globals.css

**Files:**
- Modify: `apps/web/app/styles/globals.css`

- [ ] **Step 1: Add keyframes after existing `animate-move` block**

Append after line 49 of `apps/web/app/styles/globals.css`:

```css
/* Channel Pantry animations */
@keyframes fadeSlideIn {
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes tagPop {
  0% { opacity: 0; transform: scale(0.6); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.animate-fade-slide-in {
  animation: fadeSlideIn 0.4s ease-out both;
}
.animate-tag-pop {
  animation: tagPop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.animate-shimmer {
  animation: shimmer 1.5s infinite;
}
.shimmer-bg {
  background: linear-gradient(90deg, #e5e7eb 25%, #f3f4f6 50%, #e5e7eb 75%);
  background-size: 200% 100%;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/styles/globals.css
git commit -m "feat(pantry): add CSS animations for channel pantry"
```

### Task 10: Create UI components

**Files:**
- Create: `apps/web/components/tools/channel-pantry/ChannelInput.tsx`
- Create: `apps/web/components/tools/channel-pantry/VideoCard.tsx`
- Create: `apps/web/components/tools/channel-pantry/VideoGrid.tsx`
- Create: `apps/web/components/tools/channel-pantry/LiveSummary.tsx`

- [ ] **Step 1: Create ChannelInput.tsx**

Copy from `F:\code\recipe-ingredient-resolver\src\components\pantry\ChannelInput.tsx`. Change import path only:
- `'../../types/pantry'` → `'@/lib/tools/channel-pantry/types'`

Full file:

```tsx
// apps/web/components/tools/channel-pantry/ChannelInput.tsx
"use client";

import { useState } from 'react';
import type { ChannelAnalysisResult } from '@/lib/tools/channel-pantry/types';

interface Props {
  onSubmit: (channelInput: string, videoCount: number) => void;
  isLoading: boolean;
  cachedChannels: ChannelAnalysisResult[];
  onLoadCached: (result: ChannelAnalysisResult) => void;
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days} days ago`;
}

export default function ChannelInput({ onSubmit, isLoading, cachedChannels, onLoadCached }: Props) {
  const [input, setInput] = useState('');
  const [videoCount, setVideoCount] = useState(20);

  return (
    <div>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-fd-foreground mb-1">Channel or video</label>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="@handle, channel URL, or any video URL"
            disabled={isLoading}
            className="w-full px-4 py-2.5 border border-fd-border rounded-lg text-[15px] bg-fd-card text-fd-foreground focus:outline-none focus:ring-2 focus:ring-fd-primary focus:border-transparent disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-fd-foreground mb-1">Videos</label>
          <select
            value={videoCount}
            onChange={e => setVideoCount(Number(e.target.value))}
            disabled={isLoading}
            className="px-3 py-2.5 border border-fd-border rounded-lg text-[15px] bg-fd-card text-fd-foreground focus:outline-none focus:ring-2 focus:ring-fd-primary disabled:opacity-50"
          >
            {[10, 20, 30, 50].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => onSubmit(input, videoCount)}
          disabled={isLoading || !input.trim()}
          className="px-6 py-2.5 bg-fd-primary text-fd-primary-foreground rounded-lg text-[15px] font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Analyze
        </button>
      </div>

      {cachedChannels.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-fd-muted-foreground uppercase tracking-wide mb-2">Recent</p>
          <div className="flex flex-wrap gap-2">
            {cachedChannels.map(c => (
              <button
                key={c.channelId}
                onClick={() => onLoadCached(c)}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm text-fd-muted-foreground bg-fd-card border border-fd-border rounded-full hover:border-fd-primary/50 disabled:opacity-50"
              >
                {c.channelTitle} · {timeAgo(c.timestamp)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create VideoCard.tsx**

Copy from `F:\code\recipe-ingredient-resolver\src\components\pantry\VideoCard.tsx`. Changes:
- Import path: `'@/lib/tools/channel-pantry/types'`
- Add `"use client"` directive
- Remove `React` import (not needed with Next.js JSX transform)
- Remove `key?: string` from Props (not needed with Next.js React version)

```tsx
// apps/web/components/tools/channel-pantry/VideoCard.tsx
"use client";

import type { VideoProgress, FoodCategory } from '@/lib/tools/channel-pantry/types';

interface Props {
  video: VideoProgress;
  index: number;
}

const CATEGORY_COLORS: Record<FoodCategory, string> = {
  'Proteins': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  'Dairy & Eggs': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'Vegetables': 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  'Fruits': 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  'Grains & Starches': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  'Spices & Seasonings': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  'Oils & Fats': 'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300',
  'Sauces & Condiments': 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  'Other': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

function relativeDate(iso?: string): string {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const isProcessing = (s: string) =>
  s === 'extracting_description' || s === 'fetching_transcript' || s === 'extracting_transcript';

export default function VideoCard({ video, index }: Props) {
  const processing = isProcessing(video.status);
  const done = video.status === 'done';
  const skipped = video.status === 'skipped';

  return (
    <div
      className="bg-fd-card border border-fd-border rounded-xl overflow-hidden animate-fade-slide-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative aspect-video bg-fd-muted">
        <img
          src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 right-2">
          {processing && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow-sm">
              <span className="h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </span>
          )}
          {done && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow-sm text-xs">
              ✓
            </span>
          )}
          {skipped && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 text-white shadow-sm text-xs">
              –
            </span>
          )}
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-[13px] font-medium text-fd-foreground leading-snug line-clamp-2 min-h-[2.5em]">
          {video.title}
        </h3>
        {video.publishedAt && (
          <p className="text-[11px] text-fd-muted-foreground mt-1">{relativeDate(video.publishedAt)}</p>
        )}

        <div className="mt-2 flex flex-wrap gap-1 min-h-[28px]">
          {processing && (
            <>
              <span className="shimmer-bg animate-shimmer h-5 w-14 rounded-full" />
              <span className="shimmer-bg animate-shimmer h-5 w-10 rounded-full" />
              <span className="shimmer-bg animate-shimmer h-5 w-16 rounded-full" />
            </>
          )}
          {(done || skipped) && video.ingredients.map((ing, i) => (
            <span
              key={ing.name}
              className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full animate-tag-pop ${CATEGORY_COLORS[ing.category] || CATEGORY_COLORS.Other}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {ing.name}
            </span>
          ))}
          {skipped && video.ingredients.length === 0 && (
            <span className="text-[11px] text-fd-muted-foreground italic">no ingredients found</span>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create VideoGrid.tsx**

```tsx
// apps/web/components/tools/channel-pantry/VideoGrid.tsx
"use client";

import type { VideoProgress } from '@/lib/tools/channel-pantry/types';
import VideoCard from './VideoCard';

interface Props {
  videos: VideoProgress[];
}

export default function VideoGrid({ videos }: Props) {
  if (videos.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((v, i) => (
        <VideoCard key={v.videoId} video={v} index={i} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create LiveSummary.tsx**

Copy from `F:\code\recipe-ingredient-resolver\src\components\pantry\LiveSummary.tsx`. Changes:
- Import path: `'@/lib/tools/channel-pantry/types'`
- Add `"use client"` directive
- Replace color classes with fumadocs tokens + dark mode variants

```tsx
// apps/web/components/tools/channel-pantry/LiveSummary.tsx
"use client";

import type { IngredientFrequency } from '@/lib/tools/channel-pantry/types';
import { FOOD_CATEGORIES as CATEGORIES } from '@/lib/tools/channel-pantry/types';

interface Props {
  ingredients: IngredientFrequency[];
  videosAnalyzed: number;
  isLoading: boolean;
  onCopyList: () => void;
  onReset: () => void;
}

export default function LiveSummary({ ingredients, videosAnalyzed, isLoading, onCopyList, onReset }: Props) {
  if (ingredients.length === 0 && !isLoading) return null;

  const maxCount = Math.max(...ingredients.map(i => i.count), 1);

  const grouped = new Map<string, IngredientFrequency[]>();
  for (const ing of ingredients) {
    const list = grouped.get(ing.category) || [];
    list.push(ing);
    grouped.set(ing.category, list);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-fd-foreground tracking-tight">Pantry</h2>
          {isLoading && (
            <span className="flex items-center gap-1.5 text-sm text-fd-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              Building...
            </span>
          )}
          {!isLoading && (
            <span className="text-sm text-fd-muted-foreground">{ingredients.length} ingredients</span>
          )}
        </div>
        {!isLoading && ingredients.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={onCopyList}
              className="px-3 py-1.5 text-xs bg-fd-card border border-fd-border rounded-lg text-fd-muted-foreground hover:border-fd-primary/50"
            >
              Copy list
            </button>
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-xs bg-fd-card border border-fd-border rounded-lg text-fd-muted-foreground hover:border-fd-primary/50"
            >
              New analysis
            </button>
          </div>
        )}
      </div>

      {ingredients.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {CATEGORIES.filter(cat => grouped.has(cat.name)).map(cat => {
            const items = grouped.get(cat.name)!;
            return (
              <div key={cat.name} className="bg-fd-card border border-fd-border rounded-xl p-4 animate-fade-slide-in">
                <div className="text-[13px] font-semibold text-fd-muted-foreground uppercase tracking-wide mb-3">
                  {cat.emoji} {cat.name}
                </div>
                <div className="space-y-1.5">
                  {items.map(ing => {
                    const pct = (ing.count / maxCount) * 100;
                    const ratio = ing.count / Math.max(videosAnalyzed, 1);
                    const barColor = ratio > 0.5 ? 'bg-green-500' : ratio > 0.25 ? 'bg-green-400' : 'bg-green-300';
                    return (
                      <div key={ing.name} className="flex items-center justify-between gap-2">
                        <span className="text-[14px] text-fd-foreground">{ing.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="w-16 h-1.5 bg-fd-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor} transition-all duration-[600ms] ease-out`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[12px] text-fd-muted-foreground min-w-[32px] text-right">
                            {ing.count}/{videosAnalyzed}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/components/tools/channel-pantry/
git commit -m "feat(pantry): add UI components (ChannelInput, VideoCard, VideoGrid, LiveSummary)"
```

---

## Chunk 4: PantryApp + Page + Integration

### Task 11: Create PantryApp component

**Files:**
- Create: `apps/web/components/tools/channel-pantry/PantryApp.tsx`

- [ ] **Step 1: Create the file**

Ported from `F:\code\recipe-ingredient-resolver\src\PantryApp.tsx`. Changes:
- Import paths point to `@/lib/tools/channel-pantry/*` and `@/components/tools/channel-pantry/*`
- SSR-safe: `useState([])` + `useEffect(loadCache)` instead of `useState(loadCache)`
- Add `"use client"` directive
- Replace color classes with fumadocs tokens

```tsx
// apps/web/components/tools/channel-pantry/PantryApp.tsx
"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { ChannelAnalysisResult, VideoProgress, CostAccumulator, IngredientFrequency } from '@/lib/tools/channel-pantry/types';
import { parseChannelInput, getChannelInfo, getRecentVideos, getChannelFromVideo } from '@/lib/tools/channel-pantry/youtubeService';
import { analyzeChannel } from '@/lib/tools/channel-pantry/channelAnalyzerService';
import ChannelInput from './ChannelInput';
import VideoGrid from './VideoGrid';
import LiveSummary from './LiveSummary';

const CACHE_KEY = 'pantry_cache';

function loadCache(): ChannelAnalysisResult[] {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
  } catch { return []; }
}

function saveCache(results: ChannelAnalysisResult[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(results.slice(0, 10)));
  } catch {}
}

export default function PantryApp() {
  const [result, setResult] = useState<ChannelAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const [cost, setCost] = useState<CostAccumulator>({ promptTokens: 0, outputTokens: 0, totalCost: 0 });
  const [cachedChannels, setCachedChannels] = useState<ChannelAnalysisResult[]>([]);
  const startTimeRef = useRef(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<number>();

  // SSR-safe: load cache after mount
  useEffect(() => { setCachedChannels(loadCache()); }, []);

  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isLoading]);

  const liveIngredients = useMemo((): IngredientFrequency[] => {
    const freq = new Map<string, IngredientFrequency>();
    for (const vp of videoProgress) {
      for (const ing of vp.ingredients) {
        const key = ing.name.toLowerCase();
        const existing = freq.get(key);
        if (existing) {
          existing.count++;
          if (!existing.videoIds.includes(vp.videoId)) {
            existing.videoIds.push(vp.videoId);
          }
        } else {
          freq.set(key, {
            name: ing.name,
            category: ing.category,
            count: 1,
            videoIds: [vp.videoId],
          });
        }
      }
    }
    return Array.from(freq.values()).sort((a, b) => b.count - a.count);
  }, [videoProgress]);

  const displayIngredients = result ? result.ingredients : liveIngredients;
  const videosAnalyzed = result ? result.videosAnalyzed : videoProgress.length;
  const doneCount = videoProgress.filter(v => v.status === 'done' || v.status === 'skipped').length;
  const progressPct = videoProgress.length > 0 ? Math.round((doneCount / videoProgress.length) * 100) : 0;

  const handleSubmit = useCallback(async (channelInput: string, videoCount: number) => {
    setResult(null);
    setError(null);
    setVideoProgress([]);
    setCost({ promptTokens: 0, outputTokens: 0, totalCost: 0 });
    setIsLoading(true);
    setElapsedMs(0);

    try {
      const parsed = parseChannelInput(channelInput);
      const channelHandle = parsed.type === 'channel' ? parsed.value : await getChannelFromVideo(parsed.videoId);
      const { channelId, channelTitle, uploadsPlaylistId } = await getChannelInfo(channelHandle);
      const videos = await getRecentVideos(uploadsPlaylistId, videoCount);

      if (videos.length === 0) throw new Error('No videos found on this channel');

      const onProgress = (progress: VideoProgress) => {
        setVideoProgress(prev => {
          const idx = prev.findIndex(p => p.videoId === progress.videoId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = progress;
            return next;
          }
          return [...prev, progress];
        });
      };

      const { ingredients, cost: finalCost, videosWithIngredients } = await analyzeChannel(
        videos, onProgress, (c) => setCost(c)
      );

      if (ingredients.length === 0 || videosWithIngredients < 3) {
        throw new Error("This doesn't look like a cooking channel - fewer than 3 videos had ingredients.");
      }

      const analysisResult: ChannelAnalysisResult = {
        channelId,
        channelTitle,
        videoCount: videos.length,
        videosAnalyzed: videos.length,
        videosWithIngredients,
        ingredients,
        totalCost: finalCost.totalCost,
        elapsedMs: Date.now() - startTimeRef.current,
        timestamp: Date.now(),
      };

      setResult(analysisResult);
      setCachedChannels(prev => {
        const updated = [analysisResult, ...prev.filter(c => c.channelId !== channelId)];
        saveCache(updated);
        return updated;
      });
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadCached = useCallback((cached: ChannelAnalysisResult) => {
    setResult(cached);
    setError(null);
    setVideoProgress([]);
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
    setVideoProgress([]);
    setCost({ promptTokens: 0, outputTokens: 0, totalCost: 0 });
  }, []);

  const handleCopyList = useCallback(() => {
    const ings = result ? result.ingredients : liveIngredients;
    const count = result ? result.videosAnalyzed : videoProgress.length;
    const text = ings.map(i => `${i.name} (${i.count}/${count})`).join('\n');
    navigator.clipboard.writeText(text);
  }, [result, liveIngredients, videoProgress.length]);

  const showGrid = videoProgress.length > 0 || result;

  return (
    <div className="max-w-5xl mx-auto">
      <ChannelInput
        onSubmit={handleSubmit}
        isLoading={isLoading}
        cachedChannels={cachedChannels}
        onLoadCached={handleLoadCached}
      />

      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
          <button onClick={handleReset} className="ml-3 underline">Try again</button>
        </div>
      )}

      {isLoading && videoProgress.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-fd-foreground">{doneCount}/{videoProgress.length} videos</span>
            <span className="text-sm text-fd-muted-foreground">
              ${cost.totalCost.toFixed(4)} · {Math.round(elapsedMs / 1000)}s
            </span>
          </div>
          <div className="w-full h-1 bg-fd-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-fd-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {showGrid && (
        <div className="mt-8">
          <VideoGrid videos={videoProgress} />
        </div>
      )}

      {(displayIngredients.length > 0 || isLoading) && (
        <div className="mt-8">
          <LiveSummary
            ingredients={displayIngredients}
            videosAnalyzed={videosAnalyzed}
            isLoading={isLoading}
            onCopyList={handleCopyList}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/tools/channel-pantry/PantryApp.tsx
git commit -m "feat(pantry): add PantryApp main component"
```

### Task 12: Create the tool page

**Files:**
- Create: `apps/web/app/(home)/tools/channel-pantry/page.tsx`

- [ ] **Step 1: Create the page**

Follow the exact same structure as `apps/web/app/(home)/tools/llm-price-calculator/page.tsx`:

```tsx
// apps/web/app/(home)/tools/channel-pantry/page.tsx
import Link from "next/link";
import { DocsDescription, DocsTitle } from "fumadocs-ui/page";
import type { Metadata } from "next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@repo/shadverse/components/breadcrumb";
import PantryApp from "@/components/tools/channel-pantry/PantryApp";

export const metadata: Metadata = {
  title: "Channel Pantry",
  description:
    "Analyze a YouTube cooking channel to see what ingredients they use most.",
  openGraph: {
    title: "Channel Pantry | testy.cool",
    description:
      "Analyze a YouTube cooking channel to see what ingredients they use most.",
  },
};

export default function ChannelPantryPage() {
  return (
    <>
      <section className="relative container px-4 py-8 lg:py-12 lg:px-6 text-left bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="text-center">
          <Breadcrumb className="mb-4 flex justify-center">
            <BreadcrumbList className="justify-center">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/tools">Tools</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Channel Pantry</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <DocsTitle className="dark:text-white">
            Channel Pantry
          </DocsTitle>
          <DocsDescription className="mt-3 dark:text-gray-300 mb-0">
            Analyze a YouTube cooking channel to see what ingredients they use most.
          </DocsDescription>
        </div>
      </section>

      <section className="relative container px-4 py-8 lg:py-12 lg:px-6">
        <PantryApp />
      </section>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/(home)/tools/channel-pantry/page.tsx
git commit -m "feat(pantry): add channel-pantry tool page"
```

### Task 13: Add tool to the tools index

**Files:**
- Modify: `apps/web/app/(home)/tools/page.tsx`

- [ ] **Step 1: Add entry to the `tools` array**

In `apps/web/app/(home)/tools/page.tsx`, find the `tools` array (line 35) and add the new entry:

```ts
const tools: Tool[] = [
  {
    slug: "llm-price-calculator",
    title: "LLM Price Calculator",
    description:
      "Calculator for checking API costs across Claude, GPT, and Gemini, including prompt caching.",
    tags: ["LLM", "API", "Pricing"],
  },
  {
    slug: "channel-pantry",
    title: "Channel Pantry",
    description:
      "Analyze a YouTube cooking channel to see what ingredients they use most.",
    tags: ["YouTube", "AI", "Cooking"],
  },
];
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/(home)/tools/page.tsx
git commit -m "feat(pantry): add channel-pantry to tools index"
```

---

## Chunk 5: Verify

### Task 14: Type check and build

- [ ] **Step 1: Run type check**

```bash
pnpm check-types
```

Expected: no errors.

- [ ] **Step 2: Run build**

```bash
pnpm web:build
```

Expected: build succeeds, output in `apps/web/out/`. The `tools/channel-pantry.html` file should exist in the output.

- [ ] **Step 3: Verify output contains the page**

```bash
ls apps/web/out/tools/channel-pantry/index.html
```

Expected: file exists.

- [ ] **Step 4: Fix any issues found**

If type errors or build failures, fix them and re-run. Common issues:
- Missing fumadocs token names (check `fd-*` class names exist)
- Import path resolution (ensure `@/` alias resolves correctly)

### Task 15: Local test with wrangler

- [ ] **Step 1: Run wrangler pages dev**

```bash
npx wrangler pages dev apps/web/out --compatibility-date=2024-01-01
```

Then open `http://localhost:8788/tools/channel-pantry` in browser.

Expected: page loads with the Channel Pantry UI. Input form visible.

Note: The proxy functions won't work locally without setting env vars. To test with real keys:

```bash
npx wrangler pages dev apps/web/out --compatibility-date=2024-01-01 --binding GEMINI_API_KEY=your-key-here --binding YOUTUBE_API_KEY=your-key-here
```

- [ ] **Step 2: Verify end-to-end (manual)**

Paste a cooking channel (e.g. `@JoshuaWeissman`), click Analyze. Verify:
- Video cards appear with thumbnails
- Ingredient tags pop in with animations
- Summary builds live
- Final deduped results replace live ones

### Task 16: Deploy

- [ ] **Step 1: Set Cloudflare environment secrets**

In Cloudflare Pages dashboard for `testy-cool`:
- Settings > Environment variables > Production
- Add `GEMINI_API_KEY` (encrypted)
- Add `YOUTUBE_API_KEY` (encrypted)

- [ ] **Step 2: Push and deploy**

```bash
git push origin main
```

Cloudflare Pages auto-builds on push.

- [ ] **Step 3: Verify live**

Open `https://testy.cool/tools/channel-pantry` and run an analysis to verify everything works.
