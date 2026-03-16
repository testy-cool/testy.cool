"use client";

import { useState, useMemo } from "react";

// A few representative models for the explainer widgets
const SAMPLE_MODELS = [
  { name: "Claude Haiku 4.5", input: 1, output: 5, cached: 0.1 },
  { name: "GPT-5-mini", input: 0.15, output: 0.6, cached: 0.075 },
  { name: "Claude Sonnet 4.6", input: 3, output: 15, cached: 0.3 },
  { name: "Claude Opus 4.6", input: 5, output: 25, cached: 0.5 },
];

function fmt(n: number, digits = 4): string {
  if (n < 0.0001) return "<$0.0001";
  if (n < 0.01) return `$${n.toFixed(digits)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(2)}`;
}

function Bar({
  value,
  max,
  color,
}: {
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-5 w-full rounded bg-fd-muted/50">
      <div
        className={`h-full rounded transition-all duration-300 ${color}`}
        style={{ width: `${pct}%`, minWidth: pct > 0 ? "2px" : "0" }}
      />
    </div>
  );
}

// --- TokenExplainer ---
export function TokenExplainer() {
  const [text, setText] = useState(
    "Large language models process text as tokens, not characters."
  );

  // GPT-style estimate: ~1 token per 4 chars for English
  const estimatedTokens = useMemo(() => {
    if (!text.trim()) return 0;
    return Math.max(1, Math.ceil(text.length / 4));
  }, [text]);

  const wordCount = useMemo(() => {
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [text]);

  return (
    <div className="rounded-lg border border-fd-border bg-fd-card p-5">
      <p className="text-base text-fd-muted-foreground mb-3">
        Type or paste text to see how it maps to tokens and what it would cost as
        input.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        className="w-full rounded border border-fd-border bg-fd-background p-3 text-base text-fd-foreground resize-y focus:outline-none focus:ring-1 focus:ring-fd-primary"
        placeholder="Type something..."
      />
      <div className="mt-3 flex flex-wrap gap-4 text-base">
        <span className="text-fd-muted-foreground">
          {wordCount} words
        </span>
        <span className="text-fd-foreground font-medium">
          ~{estimatedTokens} tokens
        </span>
        <span className="text-fd-muted-foreground">
          ({(wordCount / Math.max(estimatedTokens, 1)).toFixed(2)} words/token)
        </span>
      </div>
      <div className="mt-4 space-y-2">
        <p className="text-sm font-medium text-fd-muted-foreground">
          Cost as input for {estimatedTokens} tokens:
        </p>
        {SAMPLE_MODELS.map((m) => (
          <div key={m.name} className="flex items-center gap-3 text-sm">
            <span className="w-40 shrink-0 text-fd-foreground truncate">
              {m.name}
            </span>
            <span className="text-fd-muted-foreground">
              {fmt((estimatedTokens / 1_000_000) * m.input)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- InputOutputCompare ---
export function InputOutputCompare() {
  const [inputK, setInputK] = useState(2);
  const [outputK, setOutputK] = useState(1);

  const costs = useMemo(() => {
    return SAMPLE_MODELS.map((m) => {
      const inCost = (inputK * 1000 * m.input) / 1_000_000;
      const outCost = (outputK * 1000 * m.output) / 1_000_000;
      return { name: m.name, inCost, outCost, total: inCost + outCost };
    });
  }, [inputK, outputK]);

  const maxTotal = Math.max(...costs.map((c) => c.total), 0.000001);

  return (
    <div className="rounded-lg border border-fd-border bg-fd-card p-5">
      <p className="text-base text-fd-muted-foreground mb-4">
        Output tokens cost 3-5x more than input. Drag the sliders to see the
        difference.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <label className="block">
          <span className="text-base text-fd-foreground">
            Input: {inputK}K tokens
          </span>
          <input
            type="range"
            min={0.5}
            max={100}
            step={0.5}
            value={inputK}
            onChange={(e) => setInputK(Number(e.target.value))}
            className="w-full mt-1 accent-fd-primary"
          />
        </label>
        <label className="block">
          <span className="text-base text-fd-foreground">
            Output: {outputK}K tokens
          </span>
          <input
            type="range"
            min={0.1}
            max={16}
            step={0.1}
            value={outputK}
            onChange={(e) => setOutputK(Number(e.target.value))}
            className="w-full mt-1 accent-fd-primary"
          />
        </label>
      </div>
      <div className="space-y-3">
        {costs.map((c) => (
          <div key={c.name}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-fd-foreground truncate">{c.name}</span>
              <span className="text-fd-muted-foreground shrink-0 ml-2">
                {fmt(c.total)}
              </span>
            </div>
            <div className="flex gap-0.5">
              <div className="flex-1">
                <div className="h-5 w-full rounded-l bg-fd-muted/50 overflow-hidden">
                  <div
                    className="h-full bg-fd-primary/60 transition-all duration-300"
                    style={{
                      width: `${(c.inCost / maxTotal) * 100}%`,
                      minWidth: c.inCost > 0 ? "2px" : "0",
                    }}
                  />
                </div>
              </div>
              <div className="flex-1">
                <div className="h-5 w-full rounded-r bg-fd-muted/50 overflow-hidden">
                  <div
                    className="h-full bg-fd-primary transition-all duration-300"
                    style={{
                      width: `${(c.outCost / maxTotal) * 100}%`,
                      minWidth: c.outCost > 0 ? "2px" : "0",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-sm text-fd-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-fd-primary/60" />
          Input
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-fd-primary" />
          Output
        </span>
      </div>
    </div>
  );
}

// --- CachingImpact ---
export function CachingImpact() {
  const [cacheHit, setCacheHit] = useState(80);

  const costs = useMemo(() => {
    const inputTokens = 4000; // typical system prompt + context
    const hitFraction = cacheHit / 100;
    return SAMPLE_MODELS.map((m) => {
      const noCacheCost = (inputTokens / 1_000_000) * m.input;
      const cacheCost =
        (inputTokens / 1_000_000) *
        (m.input * (1 - hitFraction) + m.cached * hitFraction);
      const saved = noCacheCost - cacheCost;
      const pctSaved = noCacheCost > 0 ? (saved / noCacheCost) * 100 : 0;
      return { name: m.name, noCacheCost, cacheCost, pctSaved };
    });
  }, [cacheHit]);

  const maxCost = Math.max(...costs.map((c) => c.noCacheCost), 0.000001);

  return (
    <div className="rounded-lg border border-fd-border bg-fd-card p-5">
      <p className="text-base text-fd-muted-foreground mb-4">
        Prompt caching lets you reuse repeated input at a steep discount. Drag to
        see how cache hit rate affects cost for 4K input tokens.
      </p>
      <label className="block mb-5">
        <span className="text-base text-fd-foreground">
          Cache hit rate: {cacheHit}%
        </span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={cacheHit}
          onChange={(e) => setCacheHit(Number(e.target.value))}
          className="w-full mt-1 accent-fd-primary"
        />
      </label>
      <div className="space-y-3">
        {costs.map((c) => (
          <div key={c.name}>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-fd-foreground truncate">{c.name}</span>
              <span className="text-fd-muted-foreground shrink-0 ml-2">
                {fmt(c.cacheCost)} / {fmt(c.noCacheCost)}
                <span className="text-green-600 dark:text-green-400 ml-1">
                  -{c.pctSaved.toFixed(0)}%
                </span>
              </span>
            </div>
            <div className="flex gap-1 items-center">
              <div className="flex-1">
                <Bar value={c.cacheCost} max={maxCost} color="bg-fd-primary" />
              </div>
              <div className="flex-1">
                <Bar
                  value={c.noCacheCost}
                  max={maxCost}
                  color="bg-fd-muted-foreground/40"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-4 text-sm text-fd-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-fd-primary" />
          With caching
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded bg-fd-muted-foreground/40" />
          Without
        </span>
      </div>
    </div>
  );
}

// --- ChainCostPreview ---
export function ChainCostPreview() {
  const [turns, setTurns] = useState(5);

  // Using Claude Sonnet 4.6 as the example model
  const model = { name: "Claude Sonnet 4.6", input: 3, output: 15 };
  const avgOutputPerTurn = 500; // tokens
  const systemPrompt = 1000; // tokens

  const turnData = useMemo(() => {
    const data: { turn: number; inputTokens: number; cost: number; cumCost: number }[] = [];
    let cumCost = 0;
    for (let t = 1; t <= turns; t++) {
      // Each turn sends system prompt + all prior messages
      const priorOutputTokens = (t - 1) * avgOutputPerTurn;
      const priorInputTokens = (t - 1) * avgOutputPerTurn; // prior user msgs ~same as output
      const inputTokens = systemPrompt + priorOutputTokens + priorInputTokens + avgOutputPerTurn;
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
    <div className="rounded-lg border border-fd-border bg-fd-card p-5">
      <p className="text-base text-fd-muted-foreground mb-4">
        In multi-turn conversations, every API call sends the full history as
        input. Watch input tokens grow as you add turns.
      </p>
      <label className="block mb-4">
        <span className="text-base text-fd-foreground">
          Conversation turns: {turns}
        </span>
        <input
          type="range"
          min={1}
          max={20}
          step={1}
          value={turns}
          onChange={(e) => setTurns(Number(e.target.value))}
          className="w-full mt-1 accent-fd-primary"
        />
      </label>
      <div className="space-y-1.5">
        {turnData.map((d) => (
          <div key={d.turn} className="flex items-center gap-2 text-sm">
            <span className="w-8 text-fd-muted-foreground text-right shrink-0">
              {d.turn}
            </span>
            <div className="flex-1">
              <Bar
                value={d.inputTokens}
                max={maxInput}
                color="bg-fd-primary"
              />
            </div>
            <span className="w-16 text-fd-muted-foreground text-right shrink-0">
              {(d.inputTokens / 1000).toFixed(1)}K
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 text-base text-fd-foreground">
        <p>
          Total: <strong>{fmt(totalCost)}</strong> across {turns} turns with{" "}
          {model.name}
        </p>
        <p className="text-fd-muted-foreground text-sm mt-1">
          {multiplier > 1.05
            ? `${multiplier.toFixed(1)}x more expensive than ${turns} independent calls due to context accumulation.`
            : "Same as independent calls (single turn)."}
        </p>
      </div>
    </div>
  );
}
