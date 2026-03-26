"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Provider = "anthropic" | "openai" | "google" | "zhipu";
type Modality = "text" | "image" | "audio" | "video" | "pdf";
type CalcMode = "cost" | "budget" | "chain";

interface Model {
  name: string;
  provider: Provider;
  input: number; // $ per 1M tokens
  output: number; // $ per 1M tokens
  cachedInput: number; // $ per 1M tokens (cache read/hit price)
  context: number; // max input context window in tokens
  maxOutput: number; // max output tokens
  modalities: Modality[];
  reasoning?: number; // $ per 1M reasoning/thinking tokens
}

function formatTokenCount(n: number): string {
  if (n >= 1_000_000) {
    const val = n / 1_000_000;
    return val % 1 === 0 ? `${val}M` : `${val.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const val = n / 1_000;
    return val % 1 === 0 ? `${val}K` : `${val.toFixed(1)}K`;
  }
  return String(n);
}

const models: Model[] = [
  // Anthropic
  {
    name: "Claude Opus 4.6",
    provider: "anthropic",
    input: 5,
    output: 25,
    cachedInput: 0.5,
    context: 200_000,
    maxOutput: 128_000,
    modalities: ["text", "image", "pdf"],
    reasoning: 25,
  },
  {
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    input: 3,
    output: 15,
    cachedInput: 0.3,
    context: 200_000,
    maxOutput: 64_000,
    modalities: ["text", "image", "pdf"],
    reasoning: 15,
  },
  {
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    input: 1,
    output: 5,
    cachedInput: 0.1,
    context: 200_000,
    maxOutput: 64_000,
    modalities: ["text", "image", "pdf"],
  },
  // OpenAI
  {
    name: "GPT-5.4",
    provider: "openai",
    input: 2.5,
    output: 15,
    cachedInput: 0.25,
    context: 1_050_000,
    maxOutput: 128_000,
    modalities: ["text", "image"],
    reasoning: 15,
  },
  {
    name: "GPT-5.4-mini",
    provider: "openai",
    input: 0.75,
    output: 4.5,
    cachedInput: 0.075,
    context: 400_000,
    maxOutput: 128_000,
    modalities: ["text", "image"],
    reasoning: 4.5,
  },
  {
    name: "GPT-5.4-nano",
    provider: "openai",
    input: 0.2,
    output: 1.25,
    cachedInput: 0.02,
    context: 400_000,
    maxOutput: 128_000,
    modalities: ["text", "image"],
    reasoning: 1.25,
  },
  {
    name: "GPT-5.2",
    provider: "openai",
    input: 1.75,
    output: 14,
    cachedInput: 0.175,
    context: 400_000,
    maxOutput: 128_000,
    modalities: ["text", "image"],
    reasoning: 14,
  },
  {
    name: "GPT-5.1",
    provider: "openai",
    input: 1.25,
    output: 10,
    cachedInput: 0.125,
    context: 400_000,
    maxOutput: 128_000,
    modalities: ["text", "image"],
    reasoning: 10,
  },
  {
    name: "GPT-5",
    provider: "openai",
    input: 1.25,
    output: 10,
    cachedInput: 0.125,
    context: 400_000,
    maxOutput: 128_000,
    modalities: ["text", "image"],
    reasoning: 10,
  },
  {
    name: "GPT-5-mini",
    provider: "openai",
    input: 0.25,
    output: 2,
    cachedInput: 0.025,
    context: 400_000,
    maxOutput: 128_000,
    modalities: ["text", "image"],
    reasoning: 2,
  },
  {
    name: "GPT-5-nano",
    provider: "openai",
    input: 0.05,
    output: 0.4,
    cachedInput: 0.005,
    context: 400_000,
    maxOutput: 128_000,
    modalities: ["text", "image"],
    reasoning: 0.4,
  },
  {
    name: "GPT-4.1",
    provider: "openai",
    input: 2,
    output: 8,
    cachedInput: 0.5,
    context: 1_000_000,
    maxOutput: 32_000,
    modalities: ["text", "image"],
  },
  {
    name: "GPT-4.1-mini",
    provider: "openai",
    input: 0.4,
    output: 1.6,
    cachedInput: 0.1,
    context: 1_000_000,
    maxOutput: 32_000,
    modalities: ["text", "image"],
  },
  {
    name: "GPT-4.1-nano",
    provider: "openai",
    input: 0.1,
    output: 0.4,
    cachedInput: 0.025,
    context: 1_000_000,
    maxOutput: 32_000,
    modalities: ["text", "image"],
  },
  {
    name: "GPT-4o",
    provider: "openai",
    input: 2.5,
    output: 10,
    cachedInput: 1.25,
    context: 128_000,
    maxOutput: 16_000,
    modalities: ["text", "image"],
  },
  {
    name: "GPT-4o-mini",
    provider: "openai",
    input: 0.15,
    output: 0.6,
    cachedInput: 0.075,
    context: 128_000,
    maxOutput: 16_000,
    modalities: ["text", "image"],
  },
  {
    name: "o3-pro",
    provider: "openai",
    input: 20,
    output: 80,
    cachedInput: 20,
    context: 200_000,
    maxOutput: 100_000,
    modalities: ["text", "image"],
    reasoning: 80,
  },
  {
    name: "o3",
    provider: "openai",
    input: 2,
    output: 8,
    cachedInput: 0.5,
    context: 200_000,
    maxOutput: 100_000,
    modalities: ["text", "image"],
    reasoning: 8,
  },
  {
    name: "o4-mini",
    provider: "openai",
    input: 1.1,
    output: 4.4,
    cachedInput: 0.275,
    context: 200_000,
    maxOutput: 100_000,
    modalities: ["text", "image"],
    reasoning: 4.4,
  },
  // Google
  {
    name: "Gemini 3.1 Pro Preview",
    provider: "google",
    input: 2,
    output: 12,
    cachedInput: 0.2,
    context: 1_000_000,
    maxOutput: 65_000,
    modalities: ["text", "image", "audio", "video", "pdf"],
  },
  {
    name: "Gemini 3.1 Flash-Lite Preview",
    provider: "google",
    input: 0.25,
    output: 1.5,
    cachedInput: 0.025,
    context: 1_000_000,
    maxOutput: 65_000,
    modalities: ["text", "image", "audio", "video", "pdf"],
  },
  {
    name: "Gemini 3 Flash Preview",
    provider: "google",
    input: 0.5,
    output: 3,
    cachedInput: 0.05,
    context: 1_000_000,
    maxOutput: 65_000,
    modalities: ["text", "image", "audio", "video", "pdf"],
    reasoning: 3,
  },
  {
    name: "Gemini 2.5 Pro",
    provider: "google",
    input: 1.25,
    output: 10,
    cachedInput: 0.125,
    context: 1_000_000,
    maxOutput: 65_000,
    modalities: ["text", "image", "audio", "video", "pdf"],
    reasoning: 10,
  },
  {
    name: "Gemini 2.5 Flash",
    provider: "google",
    input: 0.3,
    output: 2.5,
    cachedInput: 0.03,
    context: 1_000_000,
    maxOutput: 65_000,
    modalities: ["text", "image", "audio", "video", "pdf"],
    reasoning: 2.5,
  },
  {
    name: "Gemini 2.5 Flash-Lite",
    provider: "google",
    input: 0.1,
    output: 0.4,
    cachedInput: 0.01,
    context: 1_000_000,
    maxOutput: 65_000,
    modalities: ["text", "image", "audio", "video", "pdf"],
  },
  {
    name: "Gemini 2.0 Flash",
    provider: "google",
    input: 0.1,
    output: 0.4,
    cachedInput: 0.025,
    context: 1_000_000,
    maxOutput: 8_192,
    modalities: ["text", "image", "audio", "video", "pdf"],
  },
  // Zhipu AI (GLM)
  {
    name: "GLM-5",
    provider: "zhipu",
    input: 1,
    output: 3.2,
    cachedInput: 0.2,
    context: 200_000,
    maxOutput: 128_000,
    modalities: ["text"],
  },
  {
    name: "GLM-5-Code",
    provider: "zhipu",
    input: 1.2,
    output: 5,
    cachedInput: 0.3,
    context: 200_000,
    maxOutput: 128_000,
    modalities: ["text"],
  },
  {
    name: "GLM-4.7",
    provider: "zhipu",
    input: 0.6,
    output: 2.2,
    cachedInput: 0.11,
    context: 200_000,
    maxOutput: 128_000,
    modalities: ["text"],
  },
  {
    name: "GLM-4.7-FlashX",
    provider: "zhipu",
    input: 0.07,
    output: 0.4,
    cachedInput: 0.01,
    context: 200_000,
    maxOutput: 128_000,
    modalities: ["text"],
  },
  {
    name: "GLM-4.5",
    provider: "zhipu",
    input: 0.6,
    output: 2.2,
    cachedInput: 0.11,
    context: 128_000,
    maxOutput: 128_000,
    modalities: ["text"],
  },
  {
    name: "GLM-4.5-X",
    provider: "zhipu",
    input: 2.2,
    output: 8.9,
    cachedInput: 0.45,
    context: 128_000,
    maxOutput: 128_000,
    modalities: ["text"],
  },
];

const providerLabels: Record<Provider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
  zhipu: "Zhipu AI",
};

const providerOrder: Provider[] = ["anthropic", "openai", "google", "zhipu"];
const allProviders = new Set<Provider>(providerOrder);

const modalityOrder: Modality[] = ["text", "image", "audio", "video", "pdf"];
const modalityFullLabels: Record<Modality, string> = {
  text: "Text",
  image: "Image",
  audio: "Audio",
  video: "Video",
  pdf: "PDF",
};

const modalityIcons: Record<Modality, React.ReactNode> = {
  text: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 6.1H3M21 12.1H3M15.1 18H3" /></svg>
  ),
  image: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" /></svg>
  ),
  audio: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10v3M6 6v11M10 3v18M14 8v7M18 5v13M22 10v3" /></svg>
  ),
  video: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.934a.5.5 0 0 0-.777-.416L16 11" /><rect width="14" height="12" x="2" y="6" rx="2" /></svg>
  ),
  pdf: (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>
  ),
};

const integerFormatter = new Intl.NumberFormat("en-US");
const currency2Formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const currency3Formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});
const currency4Formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 4,
  maximumFractionDigits: 4,
});

function formatCost(cost: number): string {
  if (cost === 0) return currency2Formatter.format(0);
  if (cost < 0.01) return currency4Formatter.format(cost);
  if (cost < 1) return currency3Formatter.format(cost);
  return currency2Formatter.format(cost);
}

function formatRate(rate: number): string {
  return `$${rate}`;
}

function formatCallCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(0);
}

const presets = [
  { label: "Chatbot", in: 2000, out: 1000, calls: 100, cache: 0 },
  { label: "Batch", in: 8000, out: 500, calls: 10000, cache: 80 },
  { label: "RAG", in: 4000, out: 2000, calls: 500, cache: 60 },
  { label: "Code", in: 3000, out: 4000, calls: 50, cache: 0 },
  { label: "Chain", in: 2000, out: 500, calls: 10, cache: 0, turn: 500 },
];

const DEFAULTS = {
  in: 1000,
  out: 500,
  calls: 1000,
  cache: 0,
  sort: "provider",
  mode: "cost",
  budget: 100,
  reasoning: 0,
  turn: 500,
};

function readParams(): {
  inputTokens: number;
  outputTokens: number;
  apiCalls: number;
  cachePercent: number;
  providerFilter: Set<Provider>;
  modalityFilter: Set<Modality>;
  sortBy: "provider" | "price";
  mode: CalcMode;
  budget: number;
  reasoningTokens: number;
  turnTokens: number;
} {
  if (typeof window === "undefined") {
    return {
      inputTokens: DEFAULTS.in,
      outputTokens: DEFAULTS.out,
      apiCalls: DEFAULTS.calls,
      cachePercent: DEFAULTS.cache,
      providerFilter: new Set(allProviders),
      modalityFilter: new Set<Modality>(),
      sortBy: DEFAULTS.sort as "provider" | "price",
      mode: DEFAULTS.mode as CalcMode,
      budget: DEFAULTS.budget,
      reasoningTokens: DEFAULTS.reasoning,
      turnTokens: DEFAULTS.turn,
    };
  }
  const p = new URLSearchParams(window.location.search);
  const providerParam = p.get("provider");
  let providerFilter: Set<Provider>;
  if (providerParam) {
    const parsed = providerParam
      .split(",")
      .filter((v) => providerOrder.includes(v as Provider)) as Provider[];
    providerFilter = parsed.length > 0 ? new Set(parsed) : new Set(allProviders);
  } else {
    providerFilter = new Set(allProviders);
  }
  const modalityParam = p.get("modality");
  let modalityFilter: Set<Modality>;
  if (modalityParam) {
    const parsed = modalityParam
      .split(",")
      .filter((v) => modalityOrder.includes(v as Modality)) as Modality[];
    modalityFilter = new Set(parsed);
  } else {
    modalityFilter = new Set<Modality>();
  }
  const modeParam = p.get("mode");
  const mode: CalcMode = modeParam === "budget" ? "budget" : modeParam === "chain" ? "chain" : "cost";
  return {
    inputTokens: Number(p.get("in")) || DEFAULTS.in,
    outputTokens: Number(p.get("out")) || DEFAULTS.out,
    apiCalls: Math.max(1, Number(p.get("calls")) || DEFAULTS.calls),
    cachePercent: Math.min(
      100,
      Math.max(0, Number(p.get("cache")) || DEFAULTS.cache),
    ),
    providerFilter,
    modalityFilter,
    sortBy: p.get("sort") === "price" ? "price" : "provider",
    mode,
    budget: Number(p.get("budget")) || DEFAULTS.budget,
    reasoningTokens: Math.max(0, Number(p.get("reasoning")) || DEFAULTS.reasoning),
    turnTokens: Math.max(0, Number(p.get("turn")) || DEFAULTS.turn),
  };
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex cursor-help">
      <svg className="h-3.5 w-3.5 text-fd-foreground/35 transition-colors group-hover:text-fd-foreground/60" viewBox="0 0 16 16" fill="currentColor">
        <path fillRule="evenodd" d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0ZM9 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM6.75 8a.75.75 0 0 0 0 1.5h.75v1.75a.75.75 0 0 0 1.5 0v-2.5A.75.75 0 0 0 8.25 8h-1.5Z" clipRule="evenodd" />
      </svg>
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-52 -translate-x-1/2 rounded-lg border border-fd-border bg-fd-card px-3 py-2 text-xs font-normal leading-relaxed text-fd-foreground/80 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {text}
      </span>
    </span>
  );
}

/** Returns key call numbers for chain progression display */
function getChainSteps(total: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const steps = new Set([1, 2, 3]);
  if (total >= 5) steps.add(5);
  if (total >= 10) steps.add(10);
  if (total >= 20) steps.add(20);
  if (total >= 50) steps.add(50);
  if (total >= 100) steps.add(100);
  steps.add(total);
  return [...steps].filter((n) => n <= total).sort((a, b) => a - b);
}

/** Closed-form cumulative cost at step N for a chain */
function chainCumulativeAt(
  params: {
    base: number;
    turnSize: number;
    inputRate: number;
    cachedRate: number;
    outputCost: number;
    reasoningCost: number;
  },
  N: number,
): number {
  const { base, turnSize, inputRate, cachedRate, outputCost, reasoningCost } = params;
  const call1 = base * inputRate + outputCost + reasoningCost;
  if (N <= 1) return call1;
  const freshPerCall = turnSize * inputRate + outputCost + reasoningCost;
  const cachedSum = (N - 1) * base + turnSize * ((N - 2) * (N - 1)) / 2;
  return call1 + (N - 1) * freshPerCall + cachedRate * cachedSum;
}

export function LlmPriceCalculator() {
  const initial = readParams();
  const [inputTokens, setInputTokens] = useState(initial.inputTokens);
  const [outputTokens, setOutputTokens] = useState(initial.outputTokens);
  const [apiCalls, setApiCalls] = useState(initial.apiCalls);
  const [cachePercent, setCachePercent] = useState(initial.cachePercent);
  const [providerFilter, setProviderFilter] = useState<Set<Provider>>(
    initial.providerFilter,
  );
  const [modalityFilter, setModalityFilter] = useState<Set<Modality>>(
    initial.modalityFilter,
  );
  const [sortBy, setSortBy] = useState<"provider" | "price">(initial.sortBy);
  const [mode, setMode] = useState<CalcMode>(initial.mode);
  const [budget, setBudget] = useState(initial.budget);
  const [reasoningTokens, setReasoningTokens] = useState(initial.reasoningTokens);
  const [turnTokens, setTurnTokens] = useState(initial.turnTokens);
  const [pinnedModels, setPinnedModels] = useState<Set<string>>(new Set());
  const [selectedModels, setSelectedModels] = useState<Set<string>>(new Set());

  const allSelected = providerFilter.size === allProviders.size;

  const toggleProvider = useCallback((provider: Provider) => {
    setProviderFilter((prev) => {
      // If all selected, switch to only this provider
      if (prev.size === allProviders.size) {
        return new Set<Provider>([provider]);
      }
      const next = new Set(prev);
      if (next.has(provider)) {
        next.delete(provider);
        // If nothing left, go back to all
        if (next.size === 0) return new Set(allProviders);
      } else {
        next.add(provider);
        // If all individually selected, set to all
        if (next.size === allProviders.size) return new Set(allProviders);
      }
      return next;
    });
  }, []);

  const toggleAllProviders = useCallback(() => {
    setProviderFilter((prev) =>
      prev.size === allProviders.size ? new Set<Provider>([providerOrder[0]]) : new Set(allProviders),
    );
  }, []);

  const toggleModality = useCallback((modality: Modality) => {
    setModalityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(modality)) {
        next.delete(modality);
      } else {
        next.add(modality);
      }
      return next;
    });
  }, []);

  const togglePin = useCallback((name: string) => {
    setPinnedModels((prev) => {
      const next = new Set(prev);
      if (next.has(name)) {
        next.delete(name);
      } else if (next.size < 3) {
        next.add(name);
      }
      return next;
    });
  }, []);

  const applyPreset = useCallback((preset: typeof presets[0]) => {
    setInputTokens(preset.in);
    setOutputTokens(preset.out);
    setApiCalls(preset.calls);
    setCachePercent(preset.cache);
    if ("turn" in preset && typeof preset.turn === "number") {
      setTurnTokens(preset.turn);
      setMode("chain");
    }
  }, []);

  // Serialize Set to stable string for useCallback deps
  const providerKey = [...providerFilter].sort().join(",");
  const modalityKey = [...modalityFilter].sort().join(",");

  const syncUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (inputTokens !== DEFAULTS.in) params.set("in", String(inputTokens));
    if (outputTokens !== DEFAULTS.out) params.set("out", String(outputTokens));
    if (apiCalls !== DEFAULTS.calls) params.set("calls", String(apiCalls));
    if (cachePercent !== DEFAULTS.cache)
      params.set("cache", String(cachePercent));
    if (!allSelected) params.set("provider", providerKey);
    if (modalityKey) params.set("modality", modalityKey);
    if (sortBy !== DEFAULTS.sort) params.set("sort", sortBy);
    if (mode !== DEFAULTS.mode) params.set("mode", mode);
    if (mode === "budget" && budget !== DEFAULTS.budget) params.set("budget", String(budget));
    if (reasoningTokens !== DEFAULTS.reasoning) params.set("reasoning", String(reasoningTokens));
    if (mode === "chain" && turnTokens !== DEFAULTS.turn) params.set("turn", String(turnTokens));
    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : "");
    window.history.replaceState(null, "", url);
  }, [
    inputTokens,
    outputTokens,
    apiCalls,
    cachePercent,
    providerKey,
    allSelected,
    modalityKey,
    sortBy,
    mode,
    budget,
    reasoningTokens,
    turnTokens,
  ]);

  useEffect(() => {
    syncUrl();
  }, [syncUrl]);

  const cacheRatio = cachePercent / 100;
  const showBulk = apiCalls > 1;
  const showCache = cachePercent > 0;
  const showAdvanced = true;
  const isBudgetMode = mode === "budget";
  const isChainMode = mode === "chain";

  const controlLabelClass =
    "mb-2 flex items-center gap-1 text-sm font-medium text-fd-foreground/72";
  const headerCellClass =
    "px-4 py-3 text-right text-xs font-medium uppercase tracking-[0.12em] text-fd-foreground/62";
  const inputClass =
    "w-full rounded-lg border border-fd-border bg-fd-background px-3.5 py-2.5 text-sm font-medium tabular-nums text-fd-foreground shadow-sm transition-[border-color,box-shadow] focus-visible:border-fd-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/20";
  const sortButtonClass =
    "rounded-md px-3 py-1.5 text-sm font-medium transition-[background-color,color,box-shadow]";
  const chipButtonClass =
    "rounded-md border px-3 py-1.5 text-sm font-medium transition-[background-color,color,border-color,box-shadow]";

  const calculated = useMemo(() => {
    return models.map((model) => {
      const inputCost = (inputTokens / 1_000_000) * model.input;
      const outputCost = (outputTokens / 1_000_000) * model.output;
      const reasoningCost = model.reasoning
        ? (reasoningTokens / 1_000_000) * model.reasoning
        : 0;
      const perCall = inputCost + outputCost + reasoningCost;

      const cachedInputPerCall =
        (inputTokens / 1_000_000) *
        ((1 - cacheRatio) * model.input + cacheRatio * model.cachedInput);
      const cachedPerCall = cachedInputPerCall + outputCost + reasoningCost;
      const subsequentCalls = Math.max(0, apiCalls - 1);
      const cachedTotal = perCall + cachedPerCall * subsequentCalls;

      const fullTotal = perCall * apiCalls;
      const savings =
        fullTotal > 0
          ? Math.max(0, ((fullTotal - cachedTotal) / fullTotal) * 100)
          : 0;

      // Budget mode: how many calls can you make?
      const effectivePerCall = showCache ? cachedPerCall : perCall;
      const maxCalls = effectivePerCall > 0 ? budget / effectivePerCall : Infinity;

      // Chain mode calculations
      const chainTurnSize = turnTokens + outputTokens;
      const chainInputRate = model.input / 1_000_000;
      const chainCachedRate = model.cachedInput / 1_000_000;
      const chainOutputCost = (outputTokens / 1_000_000) * model.output;
      const chainReasoningCost = model.reasoning
        ? (reasoningTokens / 1_000_000) * model.reasoning
        : 0;
      const chainParams = {
        base: inputTokens,
        turnSize: chainTurnSize,
        inputRate: chainInputRate,
        cachedRate: chainCachedRate,
        outputCost: chainOutputCost,
        reasoningCost: chainReasoningCost,
      };
      const chainCall1 = chainCumulativeAt(chainParams, 1);
      const chainLastCallCost =
        apiCalls <= 1
          ? chainCall1
          : (() => {
              const N = apiCalls;
              const prevInput = inputTokens + (N - 2) * chainTurnSize;
              return (
                prevInput * chainCachedRate +
                chainTurnSize * chainInputRate +
                chainOutputCost +
                chainReasoningCost
              );
            })();
      const chainTotal = chainCumulativeAt(chainParams, apiCalls);
      // Find call number where total input exceeds context window
      let chainExceedsAt = 0;
      if (inputTokens > model.context) {
        chainExceedsAt = 1;
      } else if (chainTurnSize > 0) {
        // totalInputAtN = base + (N-1) * turnSize
        const maxN = Math.floor((model.context - inputTokens) / chainTurnSize) + 1;
        if (maxN < apiCalls) chainExceedsAt = maxN + 1;
      }

      return {
        ...model,
        perCall,
        total: fullTotal,
        cachedPerCall,
        cachedTotal,
        savings,
        // cost components for breakdown tree
        inputCost,
        outputCost,
        reasoningCost,
        cachedInputCost: cachedInputPerCall,
        maxCalls,
        chainCall1,
        chainLastCall: chainLastCallCost,
        chainTotal,
        chainExceedsAt,
        chainParams,
      };
    });
  }, [inputTokens, outputTokens, reasoningTokens, apiCalls, cacheRatio, budget, showCache, turnTokens]);

  const visibleModels = useMemo(() => {
    let filtered = allSelected
      ? calculated
      : calculated.filter((model) => providerFilter.has(model.provider));

    if (modalityFilter.size > 0) {
      filtered = filtered.filter((model) =>
        [...modalityFilter].every((m) => model.modalities.includes(m)),
      );
    }

    if (isBudgetMode) {
      return [...filtered].sort((a, b) => b.maxCalls - a.maxCalls);
    }

    if (isChainMode) {
      return [...filtered].sort((a, b) => a.chainTotal - b.chainTotal);
    }

    if (sortBy === "price") {
      const key = showCache ? "cachedTotal" : "total";
      return [...filtered].sort((a, b) => a[key] - b[key]);
    }
    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculated, providerKey, allSelected, modalityKey, sortBy, showCache, isBudgetMode, isChainMode]);

  // Compute min/max for highlights and bars
  const maxCost = useMemo(() => {
    if (visibleModels.length === 0) return 0;
    const costKey = isBudgetMode ? "maxCalls" : isChainMode ? "chainTotal" : (showCache ? "cachedTotal" : "total");
    let max = 0;
    for (const m of visibleModels) {
      const val = m[costKey];
      if (val > max) max = val;
    }
    return max;
  }, [visibleModels, showCache, isBudgetMode, isChainMode]);

  // Pinned model data for comparison
  const pinnedData = useMemo(() => {
    if (pinnedModels.size < 2) return [];
    return calculated.filter((m) => pinnedModels.has(m.name));
  }, [calculated, pinnedModels]);

  const pinnedCheapest = useMemo(() => {
    if (pinnedData.length < 2) return "";
    const key = isChainMode ? "chainTotal" : showCache ? "cachedTotal" : "total";
    return pinnedData.reduce((a, b) => (a[key] < b[key] ? a : b)).name;
  }, [pinnedData, showCache, isChainMode]);

  const tableMinWidthClass = showCache ? "min-w-[1020px]" : "min-w-[860px]";

  // Compute rank for each visible model by cost (or value in budget mode)
  const rankedModels = useMemo(() => {
    const sorted = [...visibleModels];
    if (isBudgetMode) {
      sorted.sort((a, b) => b.maxCalls - a.maxCalls);
    } else if (isChainMode) {
      sorted.sort((a, b) => a.chainTotal - b.chainTotal);
    } else {
      const key = showCache ? "cachedTotal" : "total";
      sorted.sort((a, b) => a[key] - b[key]);
    }
    const rankMap = new Map<string, number>();
    sorted.forEach((m, i) => rankMap.set(m.name, i + 1));
    return rankMap;
  }, [visibleModels, showCache, isBudgetMode, isChainMode]);


  // Auto-expand the first visible model when cache is enabled so users discover the feature
  useEffect(() => {
    if (showCache && !isBudgetMode && !isChainMode && selectedModels.size === 0) {
      if (visibleModels[0]) setSelectedModels(new Set([visibleModels[0].name]));
    }
  }, [showCache, isBudgetMode, isChainMode]); // eslint-disable-line react-hooks/exhaustive-deps

  function getCostBarWidth(model: typeof visibleModels[0]): number {
    if (isBudgetMode) {
      return maxCost > 0 ? (model.maxCalls / maxCost) * 100 : 0;
    }
    if (isChainMode) {
      return maxCost > 0 ? (model.chainTotal / maxCost) * 100 : 0;
    }
    const cost = showCache ? model.cachedTotal : model.total;
    return maxCost > 0 ? (cost / maxCost) * 100 : 0;
  }

  const isMatchingPreset = (p: typeof presets[0]) =>
    inputTokens === p.in && outputTokens === p.out && apiCalls === p.calls && cachePercent === p.cache;

  return (
    <div className="not-prose">
      <style jsx global>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Input Controls - Sticky */}
      <div className="mb-5 rounded-xl border border-fd-border bg-fd-card/95 p-3 shadow-sm sm:p-5 md:sticky md:top-[var(--fd-nav-height,3.5rem)] md:z-10 md:p-6 md:backdrop-blur-sm">
        {/* Mode toggle + Presets row */}
        <div className="mb-2.5 flex flex-wrap items-center gap-1.5 sm:mb-4 sm:gap-2">
          <div className="inline-flex rounded-lg border border-fd-border bg-fd-background/80 p-1">
            <button
              onClick={() => setMode("cost")}
              className={`${sortButtonClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/20 ${
                mode === "cost"
                  ? "bg-fd-card text-fd-foreground shadow-sm ring-1 ring-fd-border"
                  : "text-fd-foreground/68 hover:bg-fd-muted/70 hover:text-fd-foreground"
              }`}
            >
              Calculate cost
            </button>
            <button
              onClick={() => setMode("budget")}
              className={`${sortButtonClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/20 ${
                mode === "budget"
                  ? "bg-fd-card text-fd-foreground shadow-sm ring-1 ring-fd-border"
                  : "text-fd-foreground/68 hover:bg-fd-muted/70 hover:text-fd-foreground"
              }`}
            >
              Set budget
            </button>
            <button
              onClick={() => setMode("chain")}
              className={`${sortButtonClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/20 ${
                mode === "chain"
                  ? "bg-fd-card text-fd-foreground shadow-sm ring-1 ring-fd-border"
                  : "text-fd-foreground/68 hover:bg-fd-muted/70 hover:text-fd-foreground"
              }`}
            >
              Chain
            </button>
          </div>
          {!isBudgetMode && !isChainMode && (
            <>
              <span className="text-fd-foreground/40 text-xs">|</span>
              {presets.map((p) => (
                <button
                  key={p.label}
                  onClick={() => applyPreset(p)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    isMatchingPreset(p)
                      ? "bg-fd-primary/10 text-fd-primary"
                      : "text-fd-foreground/55 hover:bg-fd-muted/60 hover:text-fd-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
              <span className="text-fd-foreground/40 text-xs">|</span>
              <div className="inline-flex rounded-lg border border-fd-border bg-fd-background/80 p-0.5">
                <button
                  onClick={() => setSortBy("provider")}
                  aria-pressed={sortBy === "provider"}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/20 ${
                    sortBy === "provider"
                      ? "bg-fd-card text-fd-foreground shadow-sm ring-1 ring-fd-border"
                      : "text-fd-foreground/68 hover:bg-fd-muted/70 hover:text-fd-foreground"
                  }`}
                >
                  By provider
                </button>
                <button
                  onClick={() => setSortBy("price")}
                  aria-pressed={sortBy === "price"}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/20 ${
                    sortBy === "price"
                      ? "bg-fd-card text-fd-foreground shadow-sm ring-1 ring-fd-border"
                      : "text-fd-foreground/68 hover:bg-fd-muted/70 hover:text-fd-foreground"
                  }`}
                >
                  By cost
                </button>
              </div>
            </>
          )}
        </div>

        {isChainMode ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-5 xl:gap-5">
            <div>
              <label htmlFor="chain-base-tokens" className={controlLabelClass}>
                Base tokens
                <InfoTip text="System prompt + first user message. This is the input for call 1 and gets cached in subsequent calls." />
              </label>
              <input
                id="chain-base-tokens"
                type="number"
                value={inputTokens}
                onChange={(e) => setInputTokens(Number(e.target.value))}
                min={0}
                inputMode="numeric"
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="chain-turn-tokens" className={controlLabelClass}>
                Tokens per turn
                <InfoTip text="New tokens added each turn - your follow-up message plus the model's previous response. Previous context gets cached." />
              </label>
              <input
                id="chain-turn-tokens"
                type="number"
                value={turnTokens}
                onChange={(e) => setTurnTokens(Math.max(0, Number(e.target.value)))}
                min={0}
                inputMode="numeric"
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="chain-output-tokens" className={controlLabelClass}>
                Output tokens
                <InfoTip text="Tokens the model generates per response. Usually costs 3-5x more than input tokens." />
              </label>
              <input
                id="chain-output-tokens"
                type="number"
                value={outputTokens}
                onChange={(e) => setOutputTokens(Number(e.target.value))}
                min={0}
                inputMode="numeric"
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="chain-calls" className={controlLabelClass}>
                Calls in chain
                <InfoTip text="Number of sequential calls in the conversation. Each call includes all previous context (cached) plus new tokens." />
              </label>
              <input
                id="chain-calls"
                type="number"
                value={apiCalls}
                onChange={(e) => setApiCalls(Math.max(1, Number(e.target.value)))}
                min={1}
                inputMode="numeric"
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="chain-reasoning-tokens" className={controlLabelClass}>
                Reasoning tokens
                <InfoTip text="Internal thinking tokens used by reasoning models per call. Billed at the output token rate." />
              </label>
              <input
                id="chain-reasoning-tokens"
                type="number"
                value={reasoningTokens}
                onChange={(e) => setReasoningTokens(Math.max(0, Number(e.target.value)))}
                min={0}
                inputMode="numeric"
                autoComplete="off"
                className={inputClass}
              />
            </div>
          </div>
        ) : isBudgetMode ? (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4 xl:gap-5">
            <div>
              <label htmlFor="budget-input" className={controlLabelClass}>
                Budget ($)
                <InfoTip text="Your total spending limit. Shows how many API calls each model can make within this budget." />
              </label>
              <input
                id="budget-input"
                type="number"
                value={budget}
                onChange={(e) => setBudget(Math.max(0, Number(e.target.value)))}
                min={0}
                step={10}
                inputMode="numeric"
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="budget-input-tokens" className={controlLabelClass}>
                Input Tokens / call
                <InfoTip text="Tokens you send to the model per API call - your prompt, system instructions, and any context." />
              </label>
              <input
                id="budget-input-tokens"
                type="number"
                value={inputTokens}
                onChange={(e) => setInputTokens(Number(e.target.value))}
                min={0}
                inputMode="numeric"
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="budget-output-tokens" className={controlLabelClass}>
                Output Tokens / call
                <InfoTip text="Tokens the model generates in its response. Usually costs 3-5x more than input tokens." />
              </label>
              <input
                id="budget-output-tokens"
                type="number"
                value={outputTokens}
                onChange={(e) => setOutputTokens(Number(e.target.value))}
                min={0}
                inputMode="numeric"
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="budget-reasoning-tokens" className={controlLabelClass}>
                Reasoning Tokens
                <InfoTip text="Internal thinking tokens used by reasoning models (o3, o4-mini, Claude with extended thinking). Billed at the output token rate. Set to 0 for non-reasoning models." />
              </label>
              <input
                id="budget-reasoning-tokens"
                type="number"
                value={reasoningTokens}
                onChange={(e) => setReasoningTokens(Math.max(0, Number(e.target.value)))}
                min={0}
                inputMode="numeric"
                autoComplete="off"
                className={inputClass}
              />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-5 xl:gap-5">
            <div>
              <label htmlFor="input-tokens" className={controlLabelClass}>
                Input Tokens
                <InfoTip text="Tokens you send to the model per API call - your prompt, system instructions, and any context." />
              </label>
              <input
                id="input-tokens"
                name="inputTokens"
                type="number"
                value={inputTokens}
                onChange={(e) => setInputTokens(Number(e.target.value))}
                min={0}
                inputMode="numeric"
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="output-tokens" className={controlLabelClass}>
                Output Tokens
                <InfoTip text="Tokens the model generates in its response. Usually costs 3-5x more than input tokens." />
              </label>
              <input
                id="output-tokens"
                name="outputTokens"
                type="number"
                value={outputTokens}
                onChange={(e) => setOutputTokens(Number(e.target.value))}
                min={0}
                inputMode="numeric"
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="reasoning-tokens" className={controlLabelClass}>
                Reasoning Tokens
                <InfoTip text="Internal thinking tokens used by reasoning models (o3, o4-mini, Claude with extended thinking). Billed at the output token rate. Set to 0 for non-reasoning models." />
              </label>
              <input
                id="reasoning-tokens"
                name="reasoningTokens"
                type="number"
                value={reasoningTokens}
                onChange={(e) => setReasoningTokens(Math.max(0, Number(e.target.value)))}
                min={0}
                inputMode="numeric"
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="api-calls" className={controlLabelClass}>
                API Calls
                <InfoTip text="Number of requests you'll make. Multiply per-call cost by this to get the total." />
              </label>
              <input
                id="api-calls"
                name="apiCalls"
                type="number"
                value={apiCalls}
                onChange={(e) => setApiCalls(Math.max(1, Number(e.target.value)))}
                min={1}
                inputMode="numeric"
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="cache-hit-rate" className={controlLabelClass}>
                Cache Hit Rate
                <InfoTip text="How often the model reuses cached input tokens instead of reprocessing them. Cached tokens cost 5-10x less. The first call is never cached." />
              </label>
              <div className="mt-1 flex items-center gap-3 rounded-lg border border-fd-border bg-fd-background px-3.5 py-2.5 shadow-sm transition-[border-color,box-shadow] focus-within:border-fd-primary focus-within:ring-2 focus-within:ring-fd-primary/20">
                <input
                  id="cache-hit-rate"
                  name="cachePercent"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={cachePercent}
                  onChange={(e) => setCachePercent(Number(e.target.value))}
                  className="flex-1 accent-fd-primary focus-visible:outline-none"
                />
                <span className="w-10 text-right text-sm font-medium tabular-nums text-fd-foreground">
                  {cachePercent}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comparison Panel */}
      {pinnedData.length >= 2 && (
        <div className="mb-5 rounded-xl border border-fd-primary/30 bg-fd-primary/[0.03] p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-fd-primary">
              Comparing {pinnedData.length} models
            </span>
            <button
              onClick={() => setPinnedModels(new Set())}
              className="text-xs font-medium text-fd-foreground/55 hover:text-fd-foreground transition-colors"
            >
              Clear
            </button>
          </div>
          {isChainMode ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-fd-border/60">
                    <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-[0.12em] text-fd-foreground/52">Call</th>
                    {pinnedData.map((m) => (
                      <th key={m.name} className="px-3 py-2 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-fd-foreground/62">
                        {m.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getChainSteps(apiCalls).map((step) => {
                    const costs = pinnedData.map((m) => ({
                      name: m.name,
                      cost: chainCumulativeAt(m.chainParams, step),
                    }));
                    const minCost = Math.min(...costs.map((c) => c.cost));
                    return (
                      <tr key={step} className="border-b border-fd-border/30">
                        <td className="px-3 py-2 text-fd-foreground/60 tabular-nums">{step}</td>
                        {costs.map((c) => (
                          <td
                            key={c.name}
                            className={`px-3 py-2 text-right tabular-nums font-medium ${
                              c.cost === minCost ? "text-green-500" : "text-fd-foreground"
                            }`}
                          >
                            {formatCost(c.cost)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={`grid gap-3 ${pinnedData.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
              {pinnedData.map((m) => {
                const isWinner = m.name === pinnedCheapest;
                const cost = showCache ? m.cachedTotal : m.total;
                return (
                  <div
                    key={m.name}
                    className={`rounded-lg border p-3 ${
                      isWinner
                        ? "border-green-500/40 bg-green-500/[0.06]"
                        : "border-fd-border bg-fd-card"
                    }`}
                  >
                    <div className="text-xs text-fd-muted-foreground">{providerLabels[m.provider]}</div>
                    <div className="text-sm font-semibold">{m.name}</div>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                      <span className="text-fd-foreground/55">In/M</span>
                      <span className="text-right tabular-nums">{formatRate(m.input)}</span>
                      <span className="text-fd-foreground/55">Out/M</span>
                      <span className="text-right tabular-nums">{formatRate(m.output)}</span>
                      <span className="text-fd-foreground/55">Per call</span>
                      <span className="text-right tabular-nums">{formatCost(m.perCall)}</span>
                      <span className="text-fd-foreground/55 font-medium">Total</span>
                      <span className={`text-right tabular-nums font-semibold ${isWinner ? "text-green-500" : ""}`}>
                        {formatCost(cost)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Results Table */}
      <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-card shadow-sm">
        <div className="border-b border-fd-border px-5 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm leading-6 text-fd-foreground/75">
              {isChainMode ? (
                <>
                  {integerFormatter.format(inputTokens)} base + {integerFormatter.format(turnTokens)}/turn × {integerFormatter.format(apiCalls)} calls
                  {reasoningTokens > 0 && ` · ${integerFormatter.format(reasoningTokens)} reasoning`}
                </>
              ) : isBudgetMode ? (
                <>
                  {currency2Formatter.format(budget)} budget · {integerFormatter.format(inputTokens)} in + {integerFormatter.format(outputTokens)} out per call
                  {reasoningTokens > 0 && ` + ${integerFormatter.format(reasoningTokens)} reasoning`}
                  {showCache && ` · ${cachePercent}% cached`}
                </>
              ) : (
                <>
                  {integerFormatter.format(inputTokens)} in +{" "}
                  {integerFormatter.format(outputTokens)} out
                  {reasoningTokens > 0 && ` + ${integerFormatter.format(reasoningTokens)} reasoning`}
                  {showBulk && ` \u00d7 ${integerFormatter.format(apiCalls)} calls`}
                  {showCache && ` \u00b7 ${cachePercent}% cached`}
                </>
              )}
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-fd-foreground/52">
              {integerFormatter.format(visibleModels.length)} models
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2.5 rounded-lg border border-fd-border bg-fd-background/80 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-fd-foreground/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-fd-foreground/80">
                Provider
              </span>
              <button
                onClick={toggleAllProviders}
                aria-pressed={allSelected}
                className={`${chipButtonClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/20 ${
                  allSelected
                    ? "border-fd-primary/40 bg-fd-primary/15 text-fd-foreground"
                    : "border-fd-border text-fd-foreground/66 hover:bg-fd-muted/55 hover:text-fd-foreground"
                }`}
              >
                All
              </button>
              {providerOrder.map((provider) => (
                <button
                  key={provider}
                  onClick={() => toggleProvider(provider)}
                  aria-pressed={providerFilter.has(provider)}
                  className={`${chipButtonClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/20 ${
                    !allSelected && providerFilter.has(provider)
                      ? "border-fd-primary/40 bg-fd-primary/15 text-fd-foreground"
                      : "border-fd-border text-fd-foreground/66 hover:bg-fd-muted/55 hover:text-fd-foreground"
                  }`}
                >
                  {providerLabels[provider]}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-fd-border" />

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-fd-foreground/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-fd-foreground/80">
                Input
              </span>
              {modalityOrder.map((modality) => (
                <button
                  key={modality}
                  onClick={() => toggleModality(modality)}
                  aria-pressed={modalityFilter.has(modality)}
                  className={`${chipButtonClass} inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/20 ${
                    modalityFilter.has(modality)
                      ? "border-fd-primary/40 bg-fd-primary/15 text-fd-foreground"
                      : "border-fd-border text-fd-foreground/66 hover:bg-fd-muted/55 hover:text-fd-foreground"
                  }`}
                >
                  {modalityIcons[modality]}
                  {modalityFullLabels[modality]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className={`${isBudgetMode ? "min-w-[800px]" : isChainMode ? "min-w-[900px]" : tableMinWidthClass} w-full`}>
            <thead>
              <tr className="border-b border-fd-border bg-fd-muted/15">
                <th className="w-10 px-2 py-3 text-center text-[11px] font-medium uppercase tracking-[0.12em] text-fd-foreground/62">#</th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.12em] text-fd-foreground/62">
                  Provider
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.12em] text-fd-foreground/62">
                  Model
                </th>
                <th className={headerCellClass}>Context</th>
                {showAdvanced && <th className={headerCellClass}>In/M</th>}
                {showAdvanced && <th className={headerCellClass}>Out/M</th>}
                {isChainMode ? (
                  <>
                    <th className={`${headerCellClass} text-fd-foreground/84`}>Call 1</th>
                    <th className={`${headerCellClass} border-l border-fd-border/50 text-fd-foreground/72`}>Last call</th>
                    <th className={`${headerCellClass} border-l border-fd-border/60 bg-fd-muted/12 text-fd-foreground/88`}>Total</th>
                  </>
                ) : isBudgetMode ? (
                  <th className={`${headerCellClass} border-l border-fd-border/60 bg-fd-muted/12 text-fd-foreground/88`}>
                    Max calls
                  </th>
                ) : (
                  <>
                    <th className={`${headerCellClass} text-fd-foreground/84`}>
                      {showCache ? "1st call" : "Per call"}
                    </th>
                    {showAdvanced && showCache && (
                      <th className={`${headerCellClass} border-l border-fd-border/50 text-fd-foreground/72`}>
                        Next call
                      </th>
                    )}
                    <th className={`${headerCellClass} border-l border-fd-border/60 bg-fd-muted/12 text-fd-foreground/88`}>
                      Total
                    </th>
                    {showAdvanced && showCache && (
                      <th className={`${headerCellClass} border-l border-fd-border/50 text-fd-foreground/72`}>
                        Savings
                      </th>
                    )}
                  </>
                )}
              </tr>
            </thead>
            <tbody>
            <AnimatePresence initial={false}>
              {visibleModels.map((model, index) => {
                const rank = rankedModels.get(model.name) ?? 999;
                const isTop1 = rank === 1;
                const isTop3 = rank <= 3;
                const isPinned = pinnedModels.has(model.name);
                const barWidth = getCostBarWidth(model);
                const isSelected = selectedModels.has(model.name);
                return (<>
                  <motion.tr
                    key={model.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={showCache && !isBudgetMode && !isChainMode ? () => setSelectedModels((prev) => { const next = new Set(prev); if (next.has(model.name)) next.delete(model.name); else next.add(model.name); return next; }) : undefined}
                    className={`border-b border-fd-border/70 transition-colors hover:bg-fd-muted/45 ${
                      isSelected
                        ? "bg-fd-primary/[0.06]"
                        : isPinned
                          ? "bg-fd-primary/[0.04]"
                          : index % 2 === 1
                            ? "bg-fd-muted/25"
                            : ""
                    } ${showCache && !isBudgetMode && !isChainMode ? "cursor-pointer" : ""}`}
                    style={isSelected ? { borderLeft: "3px solid var(--color-fd-primary)" } : isTop1 ? { borderLeft: "3px solid rgb(34 197 94)" } : isPinned ? { borderLeft: "3px solid var(--color-fd-primary)" } : undefined}
                  >
                    <td className="px-2 py-3.5 text-center">
                      <span className={`text-base font-semibold tabular-nums ${
                        isTop1
                          ? "text-green-500"
                          : isTop3
                            ? "text-green-500/60"
                            : "text-fd-foreground/30"
                      }`}>
                        {rank}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[15px] font-medium text-fd-foreground/72">
                      {providerLabels[model.provider]}
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => togglePin(model.name)}
                          title={isPinned ? "Unpin" : "Pin to compare"}
                          className={`text-left text-[15px] font-medium text-fd-foreground hover:text-fd-primary transition-colors ${
                            isPinned ? "underline decoration-fd-primary decoration-2 underline-offset-2" : ""
                          }`}
                        >
                          {model.name}
                        </button>
                        {model.reasoning && (
                          <span className="rounded-full bg-fd-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-fd-primary">
                            thinking
                          </span>
                        )}
                        {model.modalities.length > 1 && (
                          <span className="inline-flex items-center gap-1 text-fd-foreground/40">
                            {model.modalities.filter(m => m !== "text").map(m => (
                              <span key={m} title={modalityFullLabels[m]}>{modalityIcons[m]}</span>
                            ))}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-fd-foreground/54">
                        max output {formatTokenCount(model.maxOutput)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right text-[15px] tabular-nums text-fd-foreground/62">
                      {formatTokenCount(model.context)}/
                      {formatTokenCount(model.maxOutput)}
                    </td>
                    {showAdvanced && (
                      <td className="px-4 py-3.5 text-right text-[15px] tabular-nums text-fd-foreground/74">
                        {formatRate(model.input)}
                      </td>
                    )}
                    {showAdvanced && (
                      <td className="px-4 py-3.5 text-right text-[15px] tabular-nums text-fd-foreground/74">
                        {formatRate(model.output)}
                      </td>
                    )}
                    {isChainMode ? (
                      <>
                        <td className="border-l border-fd-border/40 px-4 py-3.5 text-right text-[15px] font-medium tabular-nums text-fd-foreground">
                          {formatCost(model.chainCall1)}
                        </td>
                        <td className="border-l border-fd-border/40 px-4 py-3.5 text-right text-[15px] font-medium tabular-nums text-fd-foreground/78">
                          {formatCost(model.chainLastCall)}
                        </td>
                        <td className="border-l border-fd-border/60 bg-fd-muted/10 px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {model.chainExceedsAt > 0 && (
                              <span title={`Exceeds ${formatTokenCount(model.context)} context at call ${model.chainExceedsAt}`} className="text-amber-500">
                                <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
                                  <path fillRule="evenodd" d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575L6.457 1.047ZM8 5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 8 5Zm1 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                            <span className={`text-[15px] font-semibold tabular-nums ${isTop1 ? "text-green-500" : "text-fd-foreground"}`}>
                              {formatCost(model.chainTotal)}
                            </span>
                          </div>
                          <div className="mt-1 h-[3px] rounded-full bg-fd-muted/40 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${isTop1 ? "bg-green-500" : "bg-fd-primary/60"}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </td>
                      </>
                    ) : isBudgetMode ? (
                      <td className="border-l border-fd-border/60 bg-fd-muted/10 px-4 py-3.5 text-right">
                        <div className={`text-[15px] font-semibold tabular-nums ${isTop1 ? "text-green-500" : "text-fd-foreground"}`}>
                          {model.maxCalls === Infinity ? "\u221e" : formatCallCount(model.maxCalls)}
                        </div>
                        <div className="mt-1 h-[3px] rounded-full bg-fd-muted/40 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${isTop1 ? "bg-green-500" : "bg-fd-primary/60"}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="border-l border-fd-border/40 px-4 py-3.5 text-right text-[15px] font-medium tabular-nums text-fd-foreground">
                          {formatCost(model.perCall)}
                        </td>
                        {showAdvanced && showCache && (
                          <td
                            className="border-l border-fd-border/40 px-4 py-3.5 text-right text-[15px] font-medium tabular-nums text-fd-foreground/78"
                            title={`Per-call breakdown (${cachePercent}% cached):\n  Input: ${formatCost(model.cachedInputCost)} (${cachePercent}% at ${formatRate(model.cachedInput)}/M, ${100 - cachePercent}% at ${formatRate(model.input)}/M)\n  Output: ${formatCost(model.outputCost)} (${formatTokenCount(outputTokens)} × ${formatRate(model.output)}/M)${model.reasoning && reasoningTokens > 0 ? `\n  Reasoning: ${formatCost(model.reasoningCost)}` : ""}`}
                          >
                            <span className="cursor-help border-b border-dashed border-fd-foreground/25">
                              {formatCost(model.cachedPerCall)}
                            </span>
                          </td>
                        )}
                        <td className="border-l border-fd-border/60 bg-fd-muted/10 px-4 py-3.5 text-right">
                          <span className={`text-[15px] font-semibold tabular-nums ${isTop1 ? "text-green-500" : "text-fd-foreground"}`}>
                            {formatCost(showCache ? model.cachedTotal : model.total)}
                          </span>
                          <div className="mt-1 h-[3px] rounded-full bg-fd-muted/40 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${isTop1 ? "bg-green-500" : "bg-fd-primary/60"}`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </td>
                        {showAdvanced && showCache && (
                          <td className="border-l border-fd-border/50 px-4 py-3.5 text-right text-[15px] font-medium tabular-nums text-fd-foreground/72">
                            {model.savings.toFixed(0)}%
                          </td>
                        )}
                      </>
                    )}
                  </motion.tr>
                  {isSelected && showCache && !isBudgetMode && !isChainMode && (() => {
                    const colCount = 4 + (showAdvanced ? 2 : 0) + (showCache ? 2 : 0) + (showBulk || showCache ? 1 : 0);
                    const subsequentCalls = Math.max(0, apiCalls - 1);
                    const inputDiscount = model.input > 0 ? Math.round((1 - model.cachedInput / model.input) * 100) : 0;
                    return (
                      <tr key={`${model.name}-detail`} className="border-b border-fd-border/50 bg-fd-muted/20" ref={(el) => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }}>
                        <td colSpan={colCount} className="px-8 py-5">
                          <table className="text-[15px]">
                            <tbody>
                              <tr>
                                <td className="pr-4 py-1 font-medium text-fd-foreground/60">Call 1</td>
                                <td className="pr-4 py-1 text-right font-semibold tabular-nums text-fd-foreground" style={{ minWidth: 72 }}>{formatCost(model.perCall)}</td>
                                <td className="py-1 text-sm text-fd-foreground/60">
                                  {formatCost(model.inputCost)} input + {formatCost(model.outputCost)} output{model.reasoningCost > 0 ? ` + ${formatCost(model.reasoningCost)} reasoning` : ""}
                                </td>
                              </tr>
                              {subsequentCalls > 0 && (
                                <tr>
                                  <td className="pr-4 py-1 font-medium text-fd-foreground/60">Call 2+</td>
                                  <td className="pr-4 py-1 text-right font-semibold tabular-nums text-fd-foreground">{formatCost(model.cachedPerCall)}</td>
                                  <td className="py-1 text-sm text-fd-foreground/60"><span className="text-green-500/80">{inputDiscount}% cheaper</span> ({formatRate(model.cachedInput)} vs {formatRate(model.input)}/M)</td>
                                </tr>
                              )}
                              <tr className="border-t border-fd-border/30">
                                <td className="pr-4 pt-2 font-bold text-fd-foreground/70">Total</td>
                                <td className="pr-4 pt-2 text-right font-bold tabular-nums text-fd-foreground">{formatCost(model.cachedTotal)}</td>
                                <td className="pt-2 text-sm font-medium text-green-500/70">
                                  {model.savings > 0 && <>saving {model.savings.toFixed(0)}% vs {formatCost(model.total)} without cache</>}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    );
                  })()}
                </>);
              })}
            </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="flex flex-col gap-2 p-2 md:hidden">
          <AnimatePresence initial={false}>
          {visibleModels.map((model) => {
            const rank = rankedModels.get(model.name) ?? 999;
            const isTop1 = rank === 1;
            const isTop3 = rank <= 3;
            const isPinned = pinnedModels.has(model.name);
            const barWidth = getCostBarWidth(model);
            return (
              <motion.div
                key={model.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className={`relative rounded-lg border px-3 py-2.5 transition-colors hover:bg-fd-muted/45 ${
                  isPinned
                    ? "border-fd-primary/40 bg-fd-primary/[0.04]"
                    : "border-fd-border bg-fd-background"
                }`}
                style={isTop1 ? { borderLeft: "3px solid rgb(34 197 94)" } : undefined}
              >
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`flex h-5 w-5 items-center justify-center rounded text-xs font-bold tabular-nums ${
                        isTop1
                          ? "text-green-500"
                          : isTop3
                            ? "text-green-500/60"
                            : "text-fd-foreground/30"
                      }`}>
                        {rank}
                      </span>
                      <button
                        onClick={() => togglePin(model.name)}
                        title={isPinned ? "Unpin" : "Pin to compare"}
                        className={`text-left text-sm font-semibold text-fd-foreground hover:text-fd-primary transition-colors ${
                          isPinned ? "underline decoration-fd-primary decoration-2 underline-offset-2" : ""
                        }`}
                      >
                        {model.name}
                      </button>
                      {model.reasoning && (
                        <span className="rounded-full bg-fd-primary/10 px-1.5 py-0.5 text-[10px] font-medium leading-none text-fd-primary">
                          thinking
                        </span>
                      )}
                      {model.modalities.length > 1 && (
                        <span className="inline-flex items-center gap-1 text-fd-foreground/40">
                          {model.modalities.filter(m => m !== "text").map(m => (
                            <span key={m} title={modalityFullLabels[m]}>{modalityIcons[m]}</span>
                          ))}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 ml-7 text-xs text-fd-muted-foreground">
                      {providerLabels[model.provider]}
                    </div>
                  </div>
                </div>

                <div className="mb-1.5 flex items-center gap-3 text-xs text-fd-muted-foreground">
                  <span>
                    {formatTokenCount(model.context)} /{" "}
                    {formatTokenCount(model.maxOutput)}
                  </span>
                  <span className="text-fd-border">|</span>
                  <span>
                    In: {formatRate(model.input)}/M &middot; Out:{" "}
                    {formatRate(model.output)}/M
                  </span>
                </div>

                {isChainMode ? (
                  <div className="grid grid-cols-3 gap-x-3 gap-y-2">
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-fd-foreground/52">
                        Call 1
                      </div>
                      <div className="text-sm font-medium tabular-nums text-fd-foreground">
                        {formatCost(model.chainCall1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-fd-foreground/52">
                        Last call
                      </div>
                      <div className="text-sm font-medium tabular-nums text-fd-foreground/78">
                        {formatCost(model.chainLastCall)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-fd-foreground/52">
                        Total
                      </div>
                      <div className="flex items-center gap-1">
                        {model.chainExceedsAt > 0 && (
                          <span title={`Exceeds context at call ${model.chainExceedsAt}`} className="text-amber-500">
                            <svg className="h-3 w-3" viewBox="0 0 16 16" fill="currentColor">
                              <path fillRule="evenodd" d="M6.457 1.047c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0 1 14.082 15H1.918a1.75 1.75 0 0 1-1.543-2.575L6.457 1.047ZM8 5a.75.75 0 0 1 .75.75v2.5a.75.75 0 0 1-1.5 0v-2.5A.75.75 0 0 1 8 5Zm1 6a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                        <span className={`text-sm font-semibold tabular-nums ${isTop1 ? "text-green-500" : "text-fd-foreground"}`}>
                          {formatCost(model.chainTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : isBudgetMode ? (
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-fd-foreground/52">
                      Max calls for {currency2Formatter.format(budget)}
                    </div>
                    <div className={`text-sm font-semibold tabular-nums ${isTop1 ? "text-green-500" : "text-fd-foreground"}`}>
                      {model.maxCalls === Infinity ? "\u221e" : formatCallCount(model.maxCalls)}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-fd-foreground/52">
                        {showCache ? "1st call" : "Per call"}
                      </div>
                      <div className="text-sm font-medium tabular-nums text-fd-foreground">
                        {formatCost(model.perCall)}
                      </div>
                    </div>
                    {showCache && (
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-fd-foreground/52">
                          Next call
                        </div>
                        <div className="text-sm font-medium tabular-nums text-fd-foreground/78">
                          {formatCost(model.cachedPerCall)}
                        </div>
                      </div>
                    )}
                    {showBulk && (
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-fd-foreground/52">
                          Total
                        </div>
                        <div className={`text-sm font-semibold tabular-nums ${isTop1 ? "text-green-500" : "text-fd-foreground"}`}>
                          {formatCost(showCache ? model.cachedTotal : model.total)}
                        </div>
                      </div>
                    )}
                    {showCache && (
                      <div>
                        <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-fd-foreground/52">
                          Savings
                        </div>
                        <div className="text-sm font-medium tabular-nums text-fd-foreground/72">
                          {model.savings.toFixed(0)}%
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Cost bar */}
                <div className="mt-2 h-[3px] rounded-full bg-fd-muted/40 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isTop1 ? "bg-green-500" : "bg-fd-primary/60"}`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>

              </motion.div>
            );
          })}
          </AnimatePresence>
        </div>

        <div className="border-t border-fd-border px-5 py-3 text-xs leading-5 text-fd-foreground/60">
          Prices per million tokens. Last updated March 2026.
          {isChainMode && " Chain mode assumes previous context is cached and each turn adds new tokens at full price."}
          {showCache && !isChainMode &&
            ` Totals reflect cache hits at the selected cache rate. Click a row to see per-call breakdown.`}
        </div>
      </div>
    </div>
  );
}
