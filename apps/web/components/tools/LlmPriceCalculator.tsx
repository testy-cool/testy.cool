"use client";

import { useState, useMemo } from "react";

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
  return `$${cost.toFixed(2)}`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) {
    const val = n / 1_000_000;
    return val % 1 === 0 ? `${val}M` : `${val.toFixed(1)}M`;
  }
  if (n >= 1_000) {
    const val = n / 1_000;
    return val % 1 === 0 ? `${val}K` : `${val.toFixed(1)}K`;
  }
  return n.toLocaleString();
}

export function LlmPriceCalculator() {
  const [inputAmount, setInputAmount] = useState(1);
  const [inputUnit, setInputUnit] = useState(1_000_000);
  const [outputAmount, setOutputAmount] = useState(100);
  const [outputUnit, setOutputUnit] = useState(1_000);
  const [cachePercent, setCachePercent] = useState(0);
  const [sortBy, setSortBy] = useState<"provider" | "price">("provider");

  const inputTokens = inputAmount * inputUnit;
  const outputTokens = outputAmount * outputUnit;
  const cacheRatio = cachePercent / 100;

  const calculated = useMemo(() => {
    return models.map((model) => {
      const inputCost = (inputTokens / 1_000_000) * model.input;
      const outputCost = (outputTokens / 1_000_000) * model.output;
      const total = inputCost + outputCost;

      const cachedInputCost =
        (inputTokens / 1_000_000) *
        ((1 - cacheRatio) * model.input + cacheRatio * model.cachedInput);
      const cachedTotal = cachedInputCost + outputCost;
      const savings = total > 0 ? ((total - cachedTotal) / total) * 100 : 0;

      return { ...model, inputCost, outputCost, total, cachedTotal, savings };
    });
  }, [inputTokens, outputTokens, cacheRatio]);

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

  const colCount = cachePercent > 0 ? 6 : 4;

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Input Tokens */}
          <div>
            <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
              Input tokens
            </label>
            <div className="flex gap-1.5">
              <input
                type="number"
                value={inputAmount}
                onChange={(e) => setInputAmount(Number(e.target.value))}
                min={0}
                className="flex-1 min-w-0 bg-fd-background border border-fd-border rounded px-3 py-2.5 font-mono focus:outline-none focus:border-fd-primary"
              />
              <select
                value={inputUnit}
                onChange={(e) => setInputUnit(Number(e.target.value))}
                className="bg-fd-background border border-fd-border rounded px-2 py-2.5 text-sm focus:outline-none focus:border-fd-primary"
              >
                <option value={1}>tokens</option>
                <option value={1000}>K</option>
                <option value={1000000}>M</option>
              </select>
            </div>
            <div className="text-[0.65rem] text-fd-muted-foreground mt-1 font-mono">
              = {formatTokens(inputTokens)} tokens
            </div>
          </div>

          {/* Output Tokens */}
          <div>
            <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
              Output tokens
            </label>
            <div className="flex gap-1.5">
              <input
                type="number"
                value={outputAmount}
                onChange={(e) => setOutputAmount(Number(e.target.value))}
                min={0}
                className="flex-1 min-w-0 bg-fd-background border border-fd-border rounded px-3 py-2.5 font-mono focus:outline-none focus:border-fd-primary"
              />
              <select
                value={outputUnit}
                onChange={(e) => setOutputUnit(Number(e.target.value))}
                className="bg-fd-background border border-fd-border rounded px-2 py-2.5 text-sm focus:outline-none focus:border-fd-primary"
              >
                <option value={1}>tokens</option>
                <option value={1000}>K</option>
                <option value={1000000}>M</option>
              </select>
            </div>
            <div className="text-[0.65rem] text-fd-muted-foreground mt-1 font-mono">
              = {formatTokens(outputTokens)} tokens
            </div>
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
            <div className="text-[0.65rem] text-fd-muted-foreground mt-1">
              {cachePercent === 0
                ? "Drag to compare with caching"
                : `${formatTokens(Math.round(inputTokens * cacheRatio))} tokens served from cache`}
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-fd-card border border-fd-border rounded-lg overflow-hidden">
        {/* Table header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-fd-border">
          <span className="text-sm text-fd-muted-foreground">
            {formatTokens(inputTokens)} in + {formatTokens(outputTokens)} out
            {cachePercent > 0 && ` · ${cachePercent}% cached`}
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
                <th className="text-right px-4 py-2.5 font-medium">Input</th>
                <th className="text-right px-4 py-2.5 font-medium">Output</th>
                <th className="text-right px-4 py-2.5 font-medium">Total</th>
                {cachePercent > 0 && (
                  <th className="text-right px-4 py-2.5 font-medium">
                    With cache
                  </th>
                )}
                {cachePercent > 0 && (
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
                  showCache={cachePercent > 0}
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
          {cachePercent > 0 &&
            " Cache prices reflect read/hit rates only - initial write costs are higher."}
        </div>
      </div>
    </div>
  );
}

interface CalculatedModel extends Model {
  inputCost: number;
  outputCost: number;
  total: number;
  cachedTotal: number;
  savings: number;
}

function ProviderGroup({
  provider,
  models,
  colCount,
  showCache,
  sortBy,
  isFirst,
}: {
  provider: Provider | null;
  models: CalculatedModel[];
  colCount: number;
  showCache: boolean;
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
          <td className="px-4 py-2.5 text-right font-mono text-fd-muted-foreground">
            {formatCost(model.inputCost)}
          </td>
          <td className="px-4 py-2.5 text-right font-mono text-fd-muted-foreground">
            {formatCost(model.outputCost)}
          </td>
          <td
            className={`px-4 py-2.5 text-right font-mono font-medium ${showCache ? "text-fd-muted-foreground line-through decoration-fd-muted-foreground/40" : ""}`}
          >
            {formatCost(model.total)}
          </td>
          {showCache && (
            <td className="px-4 py-2.5 text-right font-mono text-fd-primary font-medium">
              {formatCost(model.cachedTotal)}
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
