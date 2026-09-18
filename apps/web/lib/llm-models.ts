"use client";

import { useState, useEffect, useCallback } from "react";

export type Provider =
  | "anthropic"
  | "openai"
  | "google"
  | "deepseek"
  | "xai"
  | "mistral"
  | "meta"
  | "qwen"
  | "xiaomi"
  | "amazon"
  | "cohere"
  | "zhipu";

export type Modality = "text" | "image" | "audio" | "video" | "pdf";
export type CalcMode = "cost" | "budget" | "chain";

export interface Model {
  id?: string;
  name: string;
  provider: Provider;
  input: number; // $ per 1M tokens
  output: number; // $ per 1M tokens
  cachedInput: number; // $ per 1M tokens (cache read/hit price)
  context: number; // max input context window in tokens
  maxOutput: number; // max output tokens
  modalities: Modality[];
  reasoning?: number; // $ per 1M reasoning/thinking tokens
  created?: number;
}

export const providerLabels: Record<Provider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  deepseek: "DeepSeek",
  xai: "xAI",
  mistral: "Mistral",
  meta: "Meta",
  qwen: "Qwen",
  xiaomi: "Xiaomi",
  amazon: "Amazon",
  cohere: "Cohere",
  zhipu: "Zhipu AI",
};

export const providerOrder: Provider[] = [
  "anthropic",
  "openai",
  "google",
  "deepseek",
  "xai",
  "mistral",
  "meta",
  "qwen",
  "xiaomi",
  "amazon",
  "cohere",
  "zhipu",
];

export const defaultProvider = providerOrder[0] ?? "anthropic";
export const allProviders = new Set<Provider>(providerOrder);

export const modalityOrder: Modality[] = [
  "text",
  "image",
  "audio",
  "video",
  "pdf",
];
export const modalityFullLabels: Record<Modality, string> = {
  text: "Text",
  image: "Image",
  audio: "Audio",
  video: "Video",
  pdf: "PDF",
};

export const OPENROUTER_PROVIDER_MAP: Record<string, Provider> = {
  anthropic: "anthropic",
  openai: "openai",
  google: "google",
  deepseek: "deepseek",
  "x-ai": "xai",
  mistralai: "mistral",
  "meta-llama": "meta",
  meta: "meta",
  qwen: "qwen",
  amazon: "amazon",
  cohere: "cohere",
  "z-ai": "zhipu",
  zhipu: "zhipu",
  xiaomi: "xiaomi",
};

export function cleanModelName(rawName: string, id: string): string {
  const parts = id.split("/");
  const slug = parts[1] ?? "";
  const base = (rawName || slug || id).trim();
  return base
    .replace(
      /^(Anthropic|OpenAI|Google|DeepSeek|SpaceXAI|xAI|Mistral|Meta|Qwen|Amazon|Cohere|Z\.ai|Xiaomi):\s*/i,
      "",
    )
    .trim();
}

export interface RawOpenRouterModel {
  id: string;
  name?: string;
  created?: number;
  context_length?: number;
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
  };
  pricing?: {
    prompt?: string;
    completion?: string;
    input_cache_read?: string;
    internal_reasoning?: string;
  };
  top_provider?: {
    context_length?: number;
    max_completion_tokens?: number;
  };
}

export function normalizeOpenRouterModels(
  rawList: RawOpenRouterModel[],
): Model[] {
  const datePattern = /(-\d{4}-\d{2}-\d{2}|-\d{8}|-\d{4,6}$)/;

  const candidateModels: {
    id: string;
    slug: string;
    provider: Provider;
    raw: RawOpenRouterModel;
  }[] = [];

  for (const m of rawList) {
    const id = m.id;
    if (!id || id.includes(":batch") || id.includes(":free")) continue;
    const parts = id.split("/");
    if (parts.length !== 2) continue;
    const pRaw = parts[0];
    const slug = parts[1];
    if (!pRaw || !slug) continue;
    const provider = OPENROUTER_PROVIDER_MAP[pRaw];
    if (!provider) continue;

    candidateModels.push({ id, slug, provider, raw: m });
  }

  // Deduplicate dated snapshots when canonical slug exists (e.g. gpt-4o-2024-08-06 vs gpt-4o)
  const slugSet = new Set(candidateModels.map((c) => c.slug));
  const deduped: {
    id: string;
    slug: string;
    provider: Provider;
    raw: RawOpenRouterModel;
  }[] = [];

  for (const c of candidateModels) {
    const match = datePattern.exec(c.slug);
    if (match) {
      const baseSlug = c.slug.slice(0, match.index);
      if (slugSet.has(baseSlug)) {
        continue;
      }
    }
    deduped.push(c);
  }

  // Sort newest models first by creation date
  deduped.sort((a, b) => (b.raw.created || 0) - (a.raw.created || 0));

  const result: Model[] = [];

  for (const { id, slug, provider, raw } of deduped) {
    const pricing = raw.pricing || {};
    const input =
      Math.round(parseFloat(pricing.prompt || "0") * 1_000_000 * 10000) / 10000;
    const output =
      Math.round(parseFloat(pricing.completion || "0") * 1_000_000 * 10000) /
      10000;

    // Skip placeholder models with zero cost on both prompt and completion
    if (input === 0 && output === 0) continue;

    let cachedInput = input;
    if (
      pricing.input_cache_read !== undefined &&
      pricing.input_cache_read !== null
    ) {
      cachedInput =
        Math.round(
          parseFloat(pricing.input_cache_read || "0") * 1_000_000 * 10000,
        ) / 10000;
    }

    let reasoning: number | undefined = undefined;
    if (
      pricing.internal_reasoning !== undefined &&
      pricing.internal_reasoning !== null &&
      parseFloat(pricing.internal_reasoning) > 0
    ) {
      reasoning =
        Math.round(parseFloat(pricing.internal_reasoning) * 1_000_000 * 10000) /
        10000;
    } else if (
      provider === "anthropic" ||
      /\b(o1|o3|o4|thinking|reasoner|sol)\b/i.test(slug) ||
      /\b(o1|o3|o4)\b/i.test(raw.name || "")
    ) {
      // Extended thinking / reasoning tokens are billed at output token rates
      reasoning = output;
    }

    const top = raw.top_provider || {};
    const context = raw.context_length || top.context_length || 128_000;
    const maxOutput = top.max_completion_tokens || 4096;

    const rawMods = raw.architecture?.input_modalities || ["text"];
    const modalities: Modality[] = [];
    for (const m of rawMods) {
      if (m === "text" || m === "image" || m === "audio" || m === "video") {
        if (!modalities.includes(m)) modalities.push(m);
      } else if (m === "file" || m === "pdf") {
        if (!modalities.includes("pdf")) modalities.push("pdf");
      }
    }
    if (modalities.length === 0) modalities.push("text");

    const name = cleanModelName(raw.name || slug, id);

    result.push({
      id,
      name,
      provider,
      input,
      output,
      cachedInput,
      context,
      maxOutput,
      modalities,
      reasoning,
      created: raw.created,
    });
  }

  return result;
}

const STORAGE_KEY = "testycool_openrouter_models_v2";
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export interface LiveModelsState {
  models: Model[];
  isLive: boolean;
  lastSynced: Date | null;
  isSyncing: boolean;
  syncError: string | null;
  syncNow: () => Promise<void>;
}

export function useLiveModels(initialModels: Model[]): LiveModelsState {
  const [models, setModels] = useState<Model[]>(initialModels);
  const [isLive, setIsLive] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const fetchFromApi = useCallback(async (isManual = false) => {
    setIsSyncing(true);
    setSyncError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch("https://openrouter.ai/api/v1/models", {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`OpenRouter returned status ${res.status}`);
      }

      const data = await res.json();
      if (!Array.isArray(data?.data) || data.data.length === 0) {
        throw new Error("Invalid model list received");
      }

      const normalized = normalizeOpenRouterModels(data.data);
      if (normalized.length === 0) {
        throw new Error("No supported models after normalization");
      }

      setModels(normalized);
      setIsLive(true);
      const now = new Date();
      setLastSynced(now);

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            timestamp: now.getTime(),
            models: normalized,
          }),
        );
      } catch {
        // Ignore localStorage quota or private-mode errors
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to sync";
      setSyncError(msg);
      if (isManual) {
        console.warn("Manual model sync error:", msg);
      }
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    // 1. Check local storage cache on mount
    try {
      const rawCache = localStorage.getItem(STORAGE_KEY);
      if (rawCache) {
        const parsed = JSON.parse(rawCache);
        if (
          parsed &&
          Array.isArray(parsed.models) &&
          parsed.models.length > 0 &&
          typeof parsed.timestamp === "number"
        ) {
          setModels(parsed.models);
          setIsLive(true);
          setLastSynced(new Date(parsed.timestamp));

          // If cache is fresh, don't immediately re-fetch
          if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
            return;
          }
        }
      }
    } catch {
      // Ignore cache parse errors
    }

    // 2. Fetch fresh models in the background
    fetchFromApi(false);
  }, [fetchFromApi]);

  const syncNow = useCallback(async () => {
    await fetchFromApi(true);
  }, [fetchFromApi]);

  return {
    models,
    isLive,
    lastSynced,
    isSyncing,
    syncError,
    syncNow,
  };
}
