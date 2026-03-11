import type {
  VideoInfo, VideoProgress, ExtractedIngredient,
  IngredientFrequency, CostAccumulator,
} from './types';
import { getTranscript } from './youtubeService';
import { createCostTracker, trackGeminiResponse } from './costTracker';

const EXTRACTION_PROMPT = `You are analyzing a cooking video. Extract ALL ingredients mentioned.

Return JSON: { "ingredients": [{ "name": "canonical ingredient name", "category": "one of: Proteins, Dairy & Eggs, Vegetables, Fruits, Grains & Starches, Spices & Seasonings, Oils & Fats, Sauces & Condiments, Other", "quantity": "amount if mentioned, or null" }] }

Rules:
- Canonical names: "garlic" not "minced garlic", "chicken breast" not "boneless skinless chicken breast"
- quantity is the amount as written: "2 cups", "1 lb", "3 cloves", "1 medium". null if not mentioned.
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
  onProgress({ videoId: video.videoId, title: video.title, publishedAt: video.publishedAt, status: 'extracting_description', ingredients: [] });

  const descResult = await tryExtract(video.description, costTracker);
  if (descResult.length > 0) {
    onProgress({ videoId: video.videoId, title: video.title, publishedAt: video.publishedAt, status: 'done', tier: 'description', ingredients: descResult });
    return descResult;
  }

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
        if (ing.quantity) {
          existing.videoQuantities = { ...existing.videoQuantities, [videoId]: ing.quantity };
        }
      } else {
        freq.set(key, {
          name: ing.name,
          category: ing.category,
          count: 1,
          videoIds: [videoId],
          videoQuantities: ing.quantity ? { [videoId]: ing.quantity } : {},
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

  // Build a quantity lookup: lowercase ingredient name → videoQuantities
  // so we can re-attach after LLM dedup (LLMs are unreliable with nested objects)
  const qtyLookup = new Map<string, Record<string, string>>();
  for (const ing of ingredients) {
    const key = ing.name.toLowerCase();
    const existing = qtyLookup.get(key) || {};
    qtyLookup.set(key, { ...existing, ...ing.videoQuantities });
  }

  try {
    // Strip videoQuantities before sending to LLM
    const stripped = ingredients.map(({ videoQuantities, ...rest }) => rest);
    const data = await callGemini(
      `${DEDUP_PROMPT}\n\n${JSON.stringify(stripped)}`,
      costTracker,
      'application/json'
    );
    const parsed = JSON.parse(data.text);
    const deduped: IngredientFrequency[] = (Array.isArray(parsed) ? parsed : parsed.ingredients || ingredients)
      .sort((a: IngredientFrequency, b: IngredientFrequency) => b.count - a.count);

    // Re-attach videoQuantities from the original data based on videoIds
    for (const ing of deduped) {
      const merged: Record<string, string> = {};
      for (const vid of ing.videoIds) {
        // Search all original ingredients for this videoId's quantity
        for (const [, qtys] of qtyLookup) {
          if (qtys[vid]) { merged[vid] = qtys[vid]; break; }
        }
      }
      if (Object.keys(merged).length > 0) ing.videoQuantities = merged;
    }

    return deduped;
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
