"use client";

import { useState, useMemo } from "react";

interface Model {
  name: string;
  input: number;
  output: number;
  cachedInput: number;
}

const MODELS: Model[] = [
  { name: "Gemini 3.1 Flash-Lite", input: 0.25, output: 1.50, cachedInput: 0.0625 },
  { name: "Gemini 3 Flash", input: 0.50, output: 3.00, cachedInput: 0.125 },
  { name: "Gemini 3.1 Pro", input: 2.00, output: 12.00, cachedInput: 0.50 },
  { name: "Gemini 2.5 Flash", input: 0.30, output: 2.50, cachedInput: 0.075 },
  { name: "Gemini 2.5 Pro", input: 1.25, output: 10.00, cachedInput: 0.3125 },
  { name: "OpenAI gpt-5.4-mini", input: 0.75, output: 4.50, cachedInput: 0.075 },
  { name: "OpenAI gpt-5.4", input: 2.50, output: 15.00, cachedInput: 0.25 },
  { name: "OpenAI gpt-5.5", input: 5.00, output: 30.00, cachedInput: 0.50 },
  { name: "OpenAI o3", input: 10.00, output: 40.00, cachedInput: 1.00 },
];

function fmt(n: number): string {
  if (n === 0) return "$0.00";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  if (n < 100) return `$${n.toFixed(2)}`;
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseNum(s: string): number {
  const n = parseInt(s.replace(/,/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

export function FlexSavingsCalculator() {
  const [requests, setRequests] = useState("50000");
  const [inputTokens, setInputTokens] = useState("2000");
  const [outputTokens, setOutputTokens] = useState("1000");
  const [cachedPct, setCachedPct] = useState(0);

  const results = useMemo(() => {
    const req = parseNum(requests);
    const inTok = parseNum(inputTokens);
    const outTok = parseNum(outputTokens);
    const totalInputM = (req * inTok) / 1_000_000;
    const totalOutputM = (req * outTok) / 1_000_000;
    const cachedInputM = totalInputM * (cachedPct / 100);
    const uncachedInputM = totalInputM - cachedInputM;

    return MODELS.map((m) => {
      const standard =
        uncachedInputM * m.input +
        cachedInputM * m.cachedInput +
        totalOutputM * m.output;
      const flex = standard * 0.5;
      return { ...m, standard, flex, saved: standard - flex };
    });
  }, [requests, inputTokens, outputTokens, cachedPct]);

  const maxStandard = Math.max(...results.map((r) => r.standard), 0.000001);

  return (
    <div className="rounded-lg border border-fd-border bg-fd-card p-4 space-y-4">
      <div className="grid grid-cols-3 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-fd-muted-foreground">Requests</label>
          <input
            type="text"
            value={requests}
            onChange={(e) => setRequests(e.target.value)}
            className="w-full rounded-md border border-fd-border bg-fd-background p-2 text-sm text-fd-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-fd-primary/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-fd-muted-foreground">Input tokens/req</label>
          <input
            type="text"
            value={inputTokens}
            onChange={(e) => setInputTokens(e.target.value)}
            className="w-full rounded-md border border-fd-border bg-fd-background p-2 text-sm text-fd-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-fd-primary/50"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-fd-muted-foreground">Output tokens/req</label>
          <input
            type="text"
            value={outputTokens}
            onChange={(e) => setOutputTokens(e.target.value)}
            className="w-full rounded-md border border-fd-border bg-fd-background p-2 text-sm text-fd-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-fd-primary/50"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-fd-muted-foreground">Cached input</span>
          <span className="text-fd-foreground tabular-nums">{cachedPct}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={cachedPct}
          onChange={(e) => setCachedPct(Number(e.target.value))}
          className="w-full accent-fd-primary"
        />
      </div>

      <div className="space-y-3">
        {results.map((r) => {
          const flexPct = (r.flex / maxStandard) * 100;
          const savedPct = (r.saved / maxStandard) * 100;
          return (
            <div key={r.name}>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-sm text-fd-foreground">{r.name}</span>
                <span className="text-xs tabular-nums text-fd-muted-foreground ml-2">
                  {fmt(r.standard)} → {fmt(r.flex)}
                  <span className="text-green-500 ml-1">(-{fmt(r.saved)})</span>
                </span>
              </div>
              <div className="h-5 w-full rounded bg-fd-muted/30 flex overflow-hidden">
                <div
                  className="h-full bg-fd-primary/60 transition-all duration-300"
                  style={{ width: `${flexPct}%` }}
                />
                <div
                  className="h-full bg-green-500/30 transition-all duration-300"
                  style={{ width: `${savedPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 text-xs text-fd-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-fd-primary/60" /> Flex cost
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-sm bg-green-500/30" /> Saved
        </span>
      </div>
    </div>
  );
}
