"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

type Provider = "anthropic" | "openai" | "google";

interface Model {
  name: string;
  provider: Provider;
  input: number; // $ per 1M tokens
  output: number; // $ per 1M tokens
  cachedInput: number; // $ per 1M tokens (cache read/hit price)
}

const models: Model[] = [
  // Anthropic - cache read = 0.1x base input
  {
    name: "Claude Opus 4.6",
    provider: "anthropic",
    input: 5,
    output: 25,
    cachedInput: 0.5,
  },
  {
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    input: 3,
    output: 15,
    cachedInput: 0.3,
  },
  {
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    input: 1,
    output: 5,
    cachedInput: 0.1,
  },
  // OpenAI - cached input prices are model-specific
  {
    name: "GPT-5.3",
    provider: "openai",
    input: 1.75,
    output: 14,
    cachedInput: 0.175,
  },
  {
    name: "GPT-5-mini",
    provider: "openai",
    input: 0.25,
    output: 2,
    cachedInput: 0.025,
  },
  {
    name: "GPT-4.1",
    provider: "openai",
    input: 2,
    output: 8,
    cachedInput: 0.5,
  },
  {
    name: "GPT-4.1-mini",
    provider: "openai",
    input: 0.4,
    output: 1.6,
    cachedInput: 0.1,
  },
  {
    name: "GPT-4o",
    provider: "openai",
    input: 2.5,
    output: 10,
    cachedInput: 1.25,
  },
  {
    name: "GPT-4o-mini",
    provider: "openai",
    input: 0.15,
    output: 0.6,
    cachedInput: 0.075,
  },
  {
    name: "o3",
    provider: "openai",
    input: 2,
    output: 8,
    cachedInput: 0.5,
  },
  {
    name: "o4-mini",
    provider: "openai",
    input: 1.1,
    output: 4.4,
    cachedInput: 0.275,
  },
  // Google - cache read = 0.1x base input
  {
    name: "Gemini 3.1 Pro",
    provider: "google",
    input: 2,
    output: 12,
    cachedInput: 0.2,
  },
  {
    name: "Gemini 3.1 Flash-Lite",
    provider: "google",
    input: 0.25,
    output: 1.5,
    cachedInput: 0.025,
  },
  {
    name: "Gemini 3 Flash",
    provider: "google",
    input: 0.5,
    output: 3,
    cachedInput: 0.05,
  },
  {
    name: "Gemini 2.5 Pro",
    provider: "google",
    input: 1.25,
    output: 10,
    cachedInput: 0.125,
  },
  {
    name: "Gemini 2.5 Flash",
    provider: "google",
    input: 0.3,
    output: 2.5,
    cachedInput: 0.03,
  },
  {
    name: "Gemini 2.5 Flash-Lite",
    provider: "google",
    input: 0.1,
    output: 0.4,
    cachedInput: 0.01,
  },
];

const providerLabels: Record<Provider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

const providerOrder: Provider[] = ["anthropic", "openai", "google"];

function formatCost(cost: number): string {
  if (cost === 0) return "$0.00";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  if (cost >= 1000)
    return `$${cost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${cost.toFixed(2)}`;
}

const DEFAULTS = { in: 1000, out: 500, calls: 1000, cache: 0, sort: "provider" };

function readParams(): {
  inputTokens: number;
  outputTokens: number;
  apiCalls: number;
  cachePercent: number;
  sortBy: "provider" | "price";
} {
  if (typeof window === "undefined") {
    return {
      inputTokens: DEFAULTS.in,
      outputTokens: DEFAULTS.out,
      apiCalls: DEFAULTS.calls,
      cachePercent: DEFAULTS.cache,
      sortBy: DEFAULTS.sort as "provider" | "price",
    };
  }
  const p = new URLSearchParams(window.location.search);
  return {
    inputTokens: Number(p.get("in")) || DEFAULTS.in,
    outputTokens: Number(p.get("out")) || DEFAULTS.out,
    apiCalls: Math.max(1, Number(p.get("calls")) || DEFAULTS.calls),
    cachePercent: Math.min(100, Math.max(0, Number(p.get("cache")) || DEFAULTS.cache)),
    sortBy: p.get("sort") === "price" ? "price" : "provider",
  };
}

export function LlmPriceCalculator() {
  const initial = readParams();
  const [inputTokens, setInputTokens] = useState(initial.inputTokens);
  const [outputTokens, setOutputTokens] = useState(initial.outputTokens);
  const [apiCalls, setApiCalls] = useState(initial.apiCalls);
  const [cachePercent, setCachePercent] = useState(initial.cachePercent);
  const [sortBy, setSortBy] = useState<"provider" | "price">(initial.sortBy);

  // Sync state to URL
  const syncUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (inputTokens !== DEFAULTS.in) params.set("in", String(inputTokens));
    if (outputTokens !== DEFAULTS.out) params.set("out", String(outputTokens));
    if (apiCalls !== DEFAULTS.calls) params.set("calls", String(apiCalls));
    if (cachePercent !== DEFAULTS.cache) params.set("cache", String(cachePercent));
    if (sortBy !== DEFAULTS.sort) params.set("sort", sortBy);
    const qs = params.toString();
    const url = window.location.pathname + (qs ? `?${qs}` : "");
    window.history.replaceState(null, "", url);
  }, [inputTokens, outputTokens, apiCalls, cachePercent, sortBy]);

  useEffect(() => {
    syncUrl();
  }, [syncUrl]);

  const cacheRatio = cachePercent / 100;
  const showBulk = apiCalls > 1;

  const calculated = useMemo(() => {
    return models.map((model) => {
      const inputCost = (inputTokens / 1_000_000) * model.input;
      const outputCost = (outputTokens / 1_000_000) * model.output;
      const perCall = inputCost + outputCost;

      // First call always pays full input price (cache write).
      // Subsequent calls: only cached portion of input tokens gets the discount.
      // Output tokens are never cached.
      const cachedInputPerCall =
        (inputTokens / 1_000_000) *
        ((1 - cacheRatio) * model.input + cacheRatio * model.cachedInput);
      const cachedPerCall = cachedInputPerCall + outputCost;
      const subsequentCalls = Math.max(0, apiCalls - 1);
      const cachedTotal = perCall + cachedPerCall * subsequentCalls;

      const fullTotal = perCall * apiCalls;
      const savings =
        fullTotal > 0 ? ((fullTotal - cachedTotal) / fullTotal) * 100 : 0;

      return {
        ...model,
        perCall,
        total: fullTotal,
        cachedPerCall,
        cachedTotal,
        savings,
      };
    });
  }, [inputTokens, outputTokens, apiCalls, cacheRatio]);

  const sorted = useMemo(() => {
    if (sortBy === "price") {
      const key = cachePercent > 0 ? "cachedTotal" : "total";
      return [...calculated].sort((a, b) => a[key] - b[key]);
    }
    return calculated;
  }, [calculated, sortBy, cachePercent]);

  const grouped = useMemo(() => {
    if (sortBy === "provider") {
      return providerOrder.map((p) => ({
        provider: p as Provider | null,
        models: sorted.filter((m) => m.provider === p),
      }));
    }
    return [{ provider: null as Provider | null, models: sorted }];
  }, [sorted, sortBy]);

  // Column count for colspan on provider header rows
  const showCache = cachePercent > 0;
  let colCount = 2; // model + 1st call / per call
  if (showCache) colCount++; // next calls
  if (showBulk) colCount++; // N calls total
  if (showCache) colCount++; // savings

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

      {/* Input Controls */}
      <div className="bg-fd-card border border-fd-border rounded-lg p-5 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Input Tokens */}
          <div>
            <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
              Input tokens
            </label>
            <input
              type="number"
              value={inputTokens}
              onChange={(e) => setInputTokens(Number(e.target.value))}
              min={0}
              className="w-full bg-fd-background border border-fd-border rounded px-3 py-2.5 font-mono focus:outline-none focus:border-fd-primary"
            />
          </div>

          {/* Output Tokens */}
          <div>
            <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
              Output tokens
            </label>
            <input
              type="number"
              value={outputTokens}
              onChange={(e) => setOutputTokens(Number(e.target.value))}
              min={0}
              className="w-full bg-fd-background border border-fd-border rounded px-3 py-2.5 font-mono focus:outline-none focus:border-fd-primary"
            />
          </div>

          {/* API Calls */}
          <div>
            <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
              API calls
            </label>
            <input
              type="number"
              value={apiCalls}
              onChange={(e) => setApiCalls(Math.max(1, Number(e.target.value)))}
              min={1}
              className="w-full bg-fd-background border border-fd-border rounded px-3 py-2.5 font-mono focus:outline-none focus:border-fd-primary"
            />
          </div>

          {/* Cache Hit % */}
          <div>
            <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
              Cache hit rate
            </label>
            <div className="flex items-center gap-3 mt-1">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={cachePercent}
                onChange={(e) => setCachePercent(Number(e.target.value))}
                className="flex-1 accent-fd-primary"
              />
              <span className="font-mono text-sm w-10 text-right">
                {cachePercent}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-fd-card border border-fd-border rounded-lg overflow-hidden">
        {/* Table header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-fd-border">
          <span className="text-sm text-fd-muted-foreground">
            {inputTokens.toLocaleString()} in + {outputTokens.toLocaleString()}{" "}
            out
            {showBulk && ` × ${apiCalls.toLocaleString()} calls`}
            {showCache && ` · ${cachePercent}% cached`}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setSortBy("provider")}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                sortBy === "provider"
                  ? "bg-fd-primary/10 text-fd-primary"
                  : "text-fd-muted-foreground hover:text-fd-foreground"
              }`}
            >
              By provider
            </button>
            <button
              onClick={() => setSortBy("price")}
              className={`px-2.5 py-1 rounded text-xs transition-all ${
                sortBy === "price"
                  ? "bg-fd-primary/10 text-fd-primary"
                  : "text-fd-muted-foreground hover:text-fd-foreground"
              }`}
            >
              By price
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fd-border text-fd-muted-foreground text-[0.65rem] uppercase tracking-wider">
                <th className="text-left px-4 py-2.5 font-medium">Model</th>
                <th className="text-right px-4 py-2.5 font-medium">
                  {showCache ? "1st call" : showBulk ? "Per call" : "Total"}
                </th>
                {showCache && (
                  <th className="text-right px-4 py-2.5 font-medium">
                    Next calls
                  </th>
                )}
                {showBulk && (
                  <th className="text-right px-4 py-2.5 font-medium">
                    {apiCalls.toLocaleString()} calls
                  </th>
                )}
                {showCache && (
                  <th className="text-right px-4 py-2.5 font-medium">
                    Savings
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {grouped.map((group, gi) => (
                <ProviderGroup
                  key={group.provider ?? "all"}
                  provider={group.provider}
                  models={group.models}
                  colCount={colCount}
                  showCache={showCache}
                  showBulk={showBulk}
                  sortBy={sortBy}
                  isFirst={gi === 0}
                />
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-fd-border text-[0.65rem] text-fd-muted-foreground">
          Prices per million tokens. Last updated March 2026.
          {showCache &&
            " Only input tokens are cached. 1st call pays full price, subsequent calls use cache read rates."}
        </div>
      </div>
    </div>
  );
}

interface CalculatedModel extends Model {
  perCall: number;
  total: number;
  cachedPerCall: number;
  cachedTotal: number;
  savings: number;
}

function ProviderGroup({
  provider,
  models,
  colCount,
  showCache,
  showBulk,
  sortBy,
  isFirst,
}: {
  provider: Provider | null;
  models: CalculatedModel[];
  colCount: number;
  showCache: boolean;
  showBulk: boolean;
  sortBy: string;
  isFirst: boolean;
}) {
  return (
    <>
      {provider && (
        <tr
          className={`bg-fd-muted/50 ${!isFirst ? "border-t border-fd-border" : ""}`}
        >
          <td
            colSpan={colCount}
            className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground"
          >
            {providerLabels[provider]}
          </td>
        </tr>
      )}
      {models.map((model) => (
        <tr
          key={model.name}
          className="border-b border-fd-border/50 hover:bg-fd-muted/30 transition-colors"
        >
          <td className="px-4 py-2.5 font-medium whitespace-nowrap">
            {model.name}
            {sortBy === "price" && (
              <span className="ml-2 text-[0.65rem] text-fd-muted-foreground">
                {providerLabels[model.provider]}
              </span>
            )}
          </td>
          {/* 1st call (full price) / per call / total depending on context */}
          <td className="px-4 py-2.5 text-right font-mono font-medium">
            {formatCost(model.perCall)}
          </td>
          {/* Subsequent calls with cache discount (only input tokens cached) */}
          {showCache && (
            <td className="px-4 py-2.5 text-right font-mono text-fd-primary font-medium">
              {formatCost(model.cachedPerCall)}
            </td>
          )}
          {/* Bulk total: 1st call full + remaining cached */}
          {showBulk && (
            <td className="px-4 py-2.5 text-right font-mono font-medium">
              {formatCost(showCache ? model.cachedTotal : model.total)}
            </td>
          )}
          {showCache && (
            <td className="px-4 py-2.5 text-right font-mono text-green-600 dark:text-green-400">
              -{model.savings.toFixed(0)}%
            </td>
          )}
        </tr>
      ))}
    </>
  );
}
