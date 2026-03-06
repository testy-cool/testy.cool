"use client";

import { useState, useMemo, useEffect, useCallback } from "react";

type Provider = "anthropic" | "openai" | "google";

interface Model {
  name: string;
  provider: Provider;
  input: number; // $ per 1M tokens
  output: number; // $ per 1M tokens
  cachedInput: number; // $ per 1M tokens (cache read/hit price)
  context: number; // max input context window in tokens
  maxOutput: number; // max output tokens
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
  },
  {
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    input: 3,
    output: 15,
    cachedInput: 0.3,
    context: 200_000,
    maxOutput: 64_000,
  },
  {
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    input: 1,
    output: 5,
    cachedInput: 0.1,
    context: 200_000,
    maxOutput: 64_000,
  },
  // OpenAI
  {
    name: "GPT-5.3",
    provider: "openai",
    input: 1.75,
    output: 14,
    cachedInput: 0.175,
    context: 128_000,
    maxOutput: 128_000,
  },
  {
    name: "GPT-5-mini",
    provider: "openai",
    input: 0.25,
    output: 2,
    cachedInput: 0.025,
    context: 128_000,
    maxOutput: 16_000,
  },
  {
    name: "GPT-4.1",
    provider: "openai",
    input: 2,
    output: 8,
    cachedInput: 0.5,
    context: 1_000_000,
    maxOutput: 32_000,
  },
  {
    name: "GPT-4.1-mini",
    provider: "openai",
    input: 0.4,
    output: 1.6,
    cachedInput: 0.1,
    context: 1_000_000,
    maxOutput: 32_000,
  },
  {
    name: "GPT-4o",
    provider: "openai",
    input: 2.5,
    output: 10,
    cachedInput: 1.25,
    context: 128_000,
    maxOutput: 16_000,
  },
  {
    name: "GPT-4o-mini",
    provider: "openai",
    input: 0.15,
    output: 0.6,
    cachedInput: 0.075,
    context: 128_000,
    maxOutput: 16_000,
  },
  {
    name: "o3",
    provider: "openai",
    input: 2,
    output: 8,
    cachedInput: 0.5,
    context: 200_000,
    maxOutput: 100_000,
  },
  {
    name: "o4-mini",
    provider: "openai",
    input: 1.1,
    output: 4.4,
    cachedInput: 0.275,
    context: 200_000,
    maxOutput: 100_000,
  },
  // Google
  {
    name: "Gemini 3.1 Pro",
    provider: "google",
    input: 2,
    output: 12,
    cachedInput: 0.2,
    context: 1_000_000,
    maxOutput: 65_000,
  },
  {
    name: "Gemini 3.1 Flash-Lite",
    provider: "google",
    input: 0.25,
    output: 1.5,
    cachedInput: 0.025,
    context: 1_000_000,
    maxOutput: 65_000,
  },
  {
    name: "Gemini 3 Flash",
    provider: "google",
    input: 0.5,
    output: 3,
    cachedInput: 0.05,
    context: 1_000_000,
    maxOutput: 65_000,
  },
  {
    name: "Gemini 2.5 Pro",
    provider: "google",
    input: 1.25,
    output: 10,
    cachedInput: 0.125,
    context: 1_000_000,
    maxOutput: 65_000,
  },
  {
    name: "Gemini 2.5 Flash",
    provider: "google",
    input: 0.3,
    output: 2.5,
    cachedInput: 0.03,
    context: 1_000_000,
    maxOutput: 65_000,
  },
  {
    name: "Gemini 2.5 Flash-Lite",
    provider: "google",
    input: 0.1,
    output: 0.4,
    cachedInput: 0.01,
    context: 1_000_000,
    maxOutput: 65_000,
  },
];

const providerLabels: Record<Provider, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  google: "Google",
};

const providerOrder: Provider[] = ["anthropic", "openai", "google"];

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

const DEFAULTS = {
  in: 1000,
  out: 500,
  calls: 1000,
  cache: 0,
  sort: "provider",
};

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
    cachePercent: Math.min(
      100,
      Math.max(0, Number(p.get("cache")) || DEFAULTS.cache),
    ),
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

  const syncUrl = useCallback(() => {
    const params = new URLSearchParams();
    if (inputTokens !== DEFAULTS.in) params.set("in", String(inputTokens));
    if (outputTokens !== DEFAULTS.out) params.set("out", String(outputTokens));
    if (apiCalls !== DEFAULTS.calls) params.set("calls", String(apiCalls));
    if (cachePercent !== DEFAULTS.cache)
      params.set("cache", String(cachePercent));
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
  const showCache = cachePercent > 0;
  const cacheCol = `cache-col ${showCache ? "cache-visible" : "cache-hidden"}`;
  const controlLabelClass =
    "mb-2 block text-sm font-medium text-fd-foreground/72";
  const headerCellClass =
    "px-4 py-3 text-right text-[11px] font-medium uppercase tracking-[0.12em] text-fd-foreground/62";
  const inputClass =
    "w-full rounded-lg border border-fd-border bg-fd-background px-3.5 py-2.5 text-sm font-medium tabular-nums text-fd-foreground shadow-sm transition-[border-color,box-shadow] focus-visible:border-fd-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/20";
  const sortButtonClass =
    "rounded-md px-3 py-1.5 text-sm font-medium transition-[background-color,color,box-shadow]";

  const calculated = useMemo(() => {
    return models.map((model) => {
      const inputCost = (inputTokens / 1_000_000) * model.input;
      const outputCost = (outputTokens / 1_000_000) * model.output;
      const perCall = inputCost + outputCost;

      const cachedInputPerCall =
        (inputTokens / 1_000_000) *
        ((1 - cacheRatio) * model.input + cacheRatio * model.cachedInput);
      const cachedPerCall = cachedInputPerCall + outputCost;
      const subsequentCalls = Math.max(0, apiCalls - 1);
      const cachedTotal = perCall + cachedPerCall * subsequentCalls;

      const fullTotal = perCall * apiCalls;
      const savings =
        fullTotal > 0
          ? Math.max(0, ((fullTotal - cachedTotal) / fullTotal) * 100)
          : 0;

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
      const key = showCache ? "cachedTotal" : "total";
      return [...calculated].sort((a, b) => a[key] - b[key]);
    }
    return calculated;
  }, [calculated, sortBy, showCache]);

  const grouped = useMemo(() => {
    if (sortBy === "provider") {
      return providerOrder.map((p) => ({
        provider: p as Provider | null,
        models: sorted.filter((m) => m.provider === p),
      }));
    }
    return [{ provider: null as Provider | null, models: sorted }];
  }, [sorted, sortBy]);

  // cache cols always in DOM for animation
  let colCount = 7; // model + context + in/M + out/M + per call + next calls + savings
  if (showBulk) colCount++;

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
        .cache-col {
          overflow: hidden;
          white-space: nowrap;
          transition: opacity 0.3s ease;
        }
        .cache-hidden {
          opacity: 0;
          max-width: 0;
          padding-left: 0 !important;
          padding-right: 0 !important;
        }
        .cache-visible {
          opacity: 1;
          max-width: 10rem;
          padding-left: 1.25rem;
          padding-right: 1.25rem;
        }
      `}</style>

      {/* Input Controls */}
      <div className="mb-5 rounded-xl border border-fd-border bg-fd-card p-5 shadow-sm sm:p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 xl:gap-5">
          <div>
            <label htmlFor="input-tokens" className={controlLabelClass}>
              Input Tokens
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
            <label htmlFor="api-calls" className={controlLabelClass}>
              API Calls
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
      </div>

      {/* Results Table */}
      <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-fd-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm leading-6 text-fd-foreground/75">
            {integerFormatter.format(inputTokens)} in +{" "}
            {integerFormatter.format(outputTokens)} out
            {showBulk && ` \u00d7 ${integerFormatter.format(apiCalls)} calls`}
            {showCache && ` \u00b7 ${cachePercent}% cached`}
          </span>
          <div className="inline-flex w-fit rounded-lg border border-fd-border bg-fd-background/80 p-1">
            <button
              onClick={() => setSortBy("provider")}
              aria-pressed={sortBy === "provider"}
              className={`${sortButtonClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/20 ${
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
              className={`${sortButtonClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fd-primary/20 ${
                sortBy === "price"
                  ? "bg-fd-card text-fd-foreground shadow-sm ring-1 ring-fd-border"
                  : "text-fd-foreground/68 hover:bg-fd-muted/70 hover:text-fd-foreground"
              }`}
            >
              By price
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full">
            <thead>
              <tr className="border-b border-fd-border bg-fd-muted/15">
                <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-[0.12em] text-fd-foreground/62">
                  Model
                </th>
                <th className={headerCellClass}>Context</th>
                <th className={headerCellClass}>In/M</th>
                <th className={headerCellClass}>Out/M</th>
                <th
                  className={`${headerCellClass} border-l border-fd-border/50 text-fd-foreground/84`}
                >
                  {showCache ? "1st call" : "Per call"}
                </th>
                <th
                  className={`${headerCellClass} border-l border-fd-border/40 text-fd-primary ${cacheCol}`}
                >
                  Next calls
                </th>
                {showBulk && (
                  <th
                    className={`${headerCellClass} border-l border-fd-border/60 bg-fd-muted/12 text-fd-foreground/88`}
                  >
                    {integerFormatter.format(apiCalls)} calls
                  </th>
                )}
                <th
                  className={`${headerCellClass} border-l border-fd-border/60 text-fd-foreground/75 ${cacheCol}`}
                >
                  Savings
                </th>
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
                  cacheCol={cacheCol}
                  showBulk={showBulk}
                  sortBy={sortBy}
                  isFirst={gi === 0}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-fd-border px-5 py-3 text-[11px] leading-5 text-fd-foreground/60">
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
  cacheCol,
  showBulk,
  sortBy,
  isFirst,
}: {
  provider: Provider | null;
  models: CalculatedModel[];
  colCount: number;
  showCache: boolean;
  cacheCol: string;
  showBulk: boolean;
  sortBy: string;
  isFirst: boolean;
}) {
  return (
    <>
      {provider && (
        <tr
          className={`bg-fd-muted/60 ${!isFirst ? "border-t border-fd-border" : ""}`}
        >
          <td
            colSpan={colCount}
            className="px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-fd-foreground/64"
          >
            {providerLabels[provider]}
          </td>
        </tr>
      )}
      {models.map((model, i) => (
        <tr
          key={model.name}
          className={`border-b border-fd-border/70 transition-colors hover:bg-fd-muted/45 ${i % 2 === 1 ? "bg-fd-muted/25" : ""}`}
        >
          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-fd-foreground">
            {model.name}
            {sortBy === "price" && (
              <span className="ml-2 text-xs text-fd-foreground/55">
                {providerLabels[model.provider]}
              </span>
            )}
          </td>
          <td className="px-4 py-3 text-right text-sm tabular-nums text-fd-foreground/60">
            {formatTokenCount(model.context)}/
            {formatTokenCount(model.maxOutput)}
          </td>
          <td className="px-4 py-3 text-right text-sm tabular-nums text-fd-foreground/78">
            <span className="text-fd-foreground/45">$</span>
            {model.input}
          </td>
          <td className="px-4 py-3 text-right text-sm tabular-nums text-fd-foreground/78">
            <span className="text-fd-foreground/45">$</span>
            {model.output}
          </td>
          <td className="border-l border-fd-border/40 px-4 py-3 text-right text-sm font-semibold tabular-nums text-fd-foreground">
            {formatCost(model.perCall)}
          </td>
          <td
            className={`border-l border-fd-border/30 py-3 text-right text-sm font-semibold tabular-nums text-fd-primary ${cacheCol}`}
          >
            {formatCost(model.cachedPerCall)}
          </td>
          {showBulk && (
            <td className="border-l border-fd-border/60 bg-fd-muted/10 px-4 py-3 text-right text-sm font-semibold tabular-nums text-fd-foreground">
              {formatCost(showCache ? model.cachedTotal : model.total)}
            </td>
          )}
          <td
            className={`border-l border-fd-border/60 py-3 text-right text-sm font-medium tabular-nums text-green-600 dark:text-green-400 ${cacheCol}`}
          >
            -{model.savings.toFixed(0)}%
          </td>
        </tr>
      ))}
    </>
  );
}
