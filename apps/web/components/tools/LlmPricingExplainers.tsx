"use client";

import { useState, useMemo } from "react";

const SAMPLE_MODELS = [
  { name: "GPT-5-mini", input: 0.15, output: 0.6, cached: 0.075, color: "bg-emerald-500" },
  { name: "Claude Haiku 4.5", input: 1, output: 5, cached: 0.1, color: "bg-sky-500" },
  { name: "Claude Sonnet 4.6", input: 3, output: 15, cached: 0.3, color: "bg-violet-500" },
  { name: "Claude Opus 4.6", input: 5, output: 25, cached: 0.5, color: "bg-amber-500" },
];

function fmt(n: number): string {
  if (n === 0) return "$0";
  if (n < 0.0001) return "<$0.0001";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

// --- TokenExplainer ---
export function TokenExplainer() {
  const [text, setText] = useState(
    "Large language models process text as tokens, not characters."
  );

  const estimatedTokens = useMemo(() => {
    if (!text.trim()) return 0;
    return Math.max(1, Math.ceil(text.length / 4));
  }, [text]);

  const wordCount = useMemo(() => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [text]);

  return (
    <div className="rounded-lg border border-fd-border bg-fd-card p-5 space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        className="w-full rounded-md border border-fd-border bg-fd-background p-3 text-base text-fd-foreground resize-y focus:outline-none focus:ring-2 focus:ring-fd-primary/50"
        placeholder="Type or paste text here..."
      />
      <div className="flex flex-wrap gap-x-6 gap-y-1">
        <div className="text-2xl font-semibold text-fd-foreground tabular-nums">
          ~{estimatedTokens} <span className="text-base font-normal text-fd-muted-foreground">tokens</span>
        </div>
        <div className="text-2xl font-semibold text-fd-muted-foreground tabular-nums">
          {wordCount} <span className="text-base font-normal">words</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {SAMPLE_MODELS.map((m) => (
          <div key={m.name} className="rounded-md bg-fd-muted/50 p-3">
            <div className="text-xs text-fd-muted-foreground truncate">{m.name}</div>
            <div className="text-base font-medium text-fd-foreground mt-0.5 tabular-nums">
              {fmt((estimatedTokens / 1_000_000) * m.input)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- InputOutputCompare ---
export function InputOutputCompare() {
  const [inputK, setInputK] = useState(4);
  const [outputK, setOutputK] = useState(1);

  const costs = useMemo(() => {
    return SAMPLE_MODELS.map((m) => {
      const inCost = (inputK * 1000 * m.input) / 1_000_000;
      const outCost = (outputK * 1000 * m.output) / 1_000_000;
      return { ...m, inCost, outCost, total: inCost + outCost };
    });
  }, [inputK, outputK]);

  const maxTotal = Math.max(...costs.map((c) => c.total), 0.000001);

  return (
    <div className="rounded-lg border border-fd-border bg-fd-card p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <div className="flex justify-between text-base mb-1">
            <span className="text-fd-muted-foreground">Input</span>
            <span className="font-medium text-fd-foreground tabular-nums">{inputK}K tokens</span>
          </div>
          <input
            type="range"
            min={1}
            max={100}
            step={1}
            value={inputK}
            onChange={(e) => setInputK(Number(e.target.value))}
            className="w-full accent-sky-500"
          />
        </label>
        <label className="block">
          <div className="flex justify-between text-base mb-1">
            <span className="text-fd-muted-foreground">Output</span>
            <span className="font-medium text-fd-foreground tabular-nums">{outputK}K tokens</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={16}
            step={0.5}
            value={outputK}
            onChange={(e) => setOutputK(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </label>
      </div>
      <div className="space-y-3">
        {costs.map((c) => {
          const inPct = (c.inCost / maxTotal) * 100;
          const outPct = (c.outCost / maxTotal) * 100;
          return (
            <div key={c.name}>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-sm font-medium text-fd-foreground">{c.name}</span>
                <span className="text-sm tabular-nums text-fd-muted-foreground ml-2">
                  {fmt(c.total)}
                </span>
              </div>
              <div className="h-6 w-full rounded bg-fd-muted/30 flex overflow-hidden">
                <div
                  className="h-full bg-sky-500/70 transition-all duration-300"
                  style={{ width: `${inPct}%` }}
                />
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${outPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex gap-5 text-sm text-fd-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-sky-500/70" /> Input
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-amber-500" /> Output
        </span>
      </div>
    </div>
  );
}

// --- CachingImpact ---
export function CachingImpact() {
  const [cacheHit, setCacheHit] = useState(80);

  const costs = useMemo(() => {
    const inputTokens = 4000;
    const hitFraction = cacheHit / 100;
    return SAMPLE_MODELS.map((m) => {
      const noCacheCost = (inputTokens / 1_000_000) * m.input;
      const cacheCost =
        (inputTokens / 1_000_000) *
        (m.input * (1 - hitFraction) + m.cached * hitFraction);
      const pctSaved = noCacheCost > 0 ? ((noCacheCost - cacheCost) / noCacheCost) * 100 : 0;
      return { ...m, noCacheCost, cacheCost, pctSaved };
    });
  }, [cacheHit]);

  return (
    <div className="rounded-lg border border-fd-border bg-fd-card p-5 space-y-4">
      <label className="block">
        <div className="flex justify-between text-base mb-1">
          <span className="text-fd-muted-foreground">Cache hit rate</span>
          <span className="font-medium text-fd-foreground tabular-nums">{cacheHit}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={cacheHit}
          onChange={(e) => setCacheHit(Number(e.target.value))}
          className="w-full accent-emerald-500"
        />
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {costs.map((c) => (
          <div key={c.name} className="rounded-md bg-fd-muted/50 p-3">
            <div className="text-xs text-fd-muted-foreground truncate">{c.name}</div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-base font-medium text-fd-foreground tabular-nums">
                {fmt(c.cacheCost)}
              </span>
            </div>
            <div className="text-xs text-fd-muted-foreground mt-0.5 tabular-nums line-through">
              {fmt(c.noCacheCost)}
            </div>
            {c.pctSaved > 0 && (
              <div className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                -{c.pctSaved.toFixed(0)}%
              </div>
            )}
          </div>
        ))}
      </div>
      <p className="text-sm text-fd-muted-foreground">
        Based on 4K input tokens per call. Cached tokens use each provider&apos;s discounted rate.
      </p>
    </div>
  );
}

// --- ChainCostPreview ---
export function ChainCostPreview() {
  const [turns, setTurns] = useState(5);

  const model = { name: "Claude Sonnet 4.6", input: 3, output: 15 };
  const avgOutputPerTurn = 500;
  const systemPrompt = 1000;

  const turnData = useMemo(() => {
    const data: { turn: number; inputTokens: number; cost: number; cumCost: number }[] = [];
    let cumCost = 0;
    for (let t = 1; t <= turns; t++) {
      const priorTokens = (t - 1) * avgOutputPerTurn * 2; // prior user + assistant msgs
      const inputTokens = systemPrompt + priorTokens + avgOutputPerTurn;
      const cost =
        (inputTokens / 1_000_000) * model.input +
        (avgOutputPerTurn / 1_000_000) * model.output;
      cumCost += cost;
      data.push({ turn: t, inputTokens, cost, cumCost });
    }
    return data;
  }, [turns]);

  const maxInput = Math.max(...turnData.map((d) => d.inputTokens));
  const totalCost = turnData[turnData.length - 1]?.cumCost ?? 0;
  const singleCallCost = turnData[0]?.cost ?? 0;
  const multiplier = singleCallCost > 0 ? totalCost / (singleCallCost * turns) : 1;

  return (
    <div className="rounded-lg border border-fd-border bg-fd-card p-5 space-y-4">
      <label className="block">
        <div className="flex justify-between text-base mb-1">
          <span className="text-fd-muted-foreground">Turns</span>
          <span className="font-medium text-fd-foreground tabular-nums">{turns}</span>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={turns}
          onChange={(e) => setTurns(Number(e.target.value))}
          className="w-full accent-violet-500"
        />
      </label>
      <div className="space-y-1">
        {turnData.map((d) => (
          <div key={d.turn} className="flex items-center gap-2 text-sm">
            <span className="w-6 text-fd-muted-foreground text-right shrink-0 tabular-nums text-xs">
              {d.turn}
            </span>
            <div className="flex-1 h-5 rounded bg-fd-muted/30 overflow-hidden">
              <div
                className="h-full bg-violet-500 transition-all duration-300 rounded"
                style={{
                  width: `${(d.inputTokens / maxInput) * 100}%`,
                  minWidth: "4px",
                }}
              />
            </div>
            <span className="w-14 text-fd-muted-foreground text-right shrink-0 tabular-nums text-xs">
              {(d.inputTokens / 1000).toFixed(1)}K
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <span className="text-2xl font-semibold text-fd-foreground tabular-nums">
          {fmt(totalCost)}
        </span>
        <span className="text-base text-fd-muted-foreground">
          {turns} turns with {model.name}
        </span>
        {multiplier > 1.05 && (
          <span className="text-sm text-amber-600 dark:text-amber-400 tabular-nums">
            {multiplier.toFixed(1)}x vs independent calls
          </span>
        )}
      </div>
    </div>
  );
}
