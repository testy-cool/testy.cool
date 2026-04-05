"use client";

import { useMemo, useState } from "react";

type Token = { text: string; raw: string; idx: number };

interface NgramRow {
  ngram: string;
  tokens: string[];
  count: number;
}

interface PhraseFrame {
  skeleton: string; // e.g. "* pe piata din romania"
  position: number; // which index is the slot
  fillers: { word: string; count: number }[];
  total: number;
}

function tokenize(text: string, caseSensitive: boolean): Token[] {
  // Keep unicode letters, digits, and internal hyphens/apostrophes
  // Split on everything else. Includes Romanian diacritics via \p{L}.
  const regex = /[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu;
  const tokens: Token[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const raw = m[0];
    tokens.push({
      raw,
      text: caseSensitive ? raw : raw.toLowerCase(),
      idx: m.index,
    });
  }
  return tokens;
}

function computeNgrams(
  tokens: Token[],
  n: number,
): Map<string, { tokens: string[]; count: number }> {
  const map = new Map<string, { tokens: string[]; count: number }>();
  for (let i = 0; i <= tokens.length - n; i++) {
    const slice = tokens.slice(i, i + n).map((t) => t.text);
    const key = slice.join(" ");
    const existing = map.get(key);
    if (existing) existing.count++;
    else map.set(key, { tokens: slice, count: 1 });
  }
  return map;
}

function computePhraseFrames(
  ngrams: Map<string, { tokens: string[]; count: number }>,
  n: number,
  slotPosition: number | "any",
  minVariants: number,
): PhraseFrame[] {
  // For each ngram, create a skeleton by replacing one position with "*".
  // Group ngrams that share a skeleton. Each skeleton becomes a phrase frame
  // with its fillers = the words that appeared at the slot position.
  const frames = new Map<
    string,
    { position: number; fillers: Map<string, number> }
  >();

  for (const { tokens, count } of ngrams.values()) {
    const positions = slotPosition === "any"
      ? Array.from({ length: n }, (_, i) => i)
      : [slotPosition];

    for (const pos of positions) {
      if (pos >= tokens.length) continue;
      const skel = tokens
        .map((t, i) => (i === pos ? "*" : t))
        .join(" ");
      const key = `${pos}|${skel}`;
      let frame = frames.get(key);
      if (!frame) {
        frame = { position: pos, fillers: new Map() };
        frames.set(key, frame);
      }
      const filler = tokens[pos];
      frame.fillers.set(filler, (frame.fillers.get(filler) ?? 0) + count);
    }
  }

  const result: PhraseFrame[] = [];
  for (const [key, { position, fillers }] of frames) {
    if (fillers.size < minVariants) continue;
    const skeleton = key.slice(key.indexOf("|") + 1);
    const fillerList = Array.from(fillers.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
    const total = fillerList.reduce((s, f) => s + f.count, 0);
    result.push({ skeleton, position, fillers: fillerList, total });
  }

  return result.sort((a, b) => b.total - a.total);
}

function renderFrameLabel(frame: PhraseFrame, maxShow = 4): string {
  const words = frame.skeleton.split(" ");
  const shown = frame.fillers.slice(0, maxShow).map((f) => f.word);
  const more = frame.fillers.length - shown.length;
  const alt =
    "(" + shown.join("|") + (more > 0 ? `|+${more} more` : "") + ")";
  return words.map((w) => (w === "*" ? alt : w)).join(" ");
}

function toCSV(rows: string[][]): string {
  return rows
    .map((r) =>
      r
        .map((c) => {
          const needsQuote = /[",\n]/.test(c);
          const escaped = c.replace(/"/g, '""');
          return needsQuote ? `"${escaped}"` : escaped;
        })
        .join(","),
    )
    .join("\n");
}

function downloadCSV(filename: string, rows: string[][]) {
  const blob = new Blob([toCSV(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function NgramViewer() {
  const [text, setText] = useState("");
  const [n, setN] = useState(5);
  const [minCount, setMinCount] = useState(2);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [view, setView] = useState<"ngrams" | "frames">("frames");
  const [search, setSearch] = useState("");
  const [slotPosition, setSlotPosition] = useState<number | "any">("any");
  const [minVariants, setMinVariants] = useState(2);
  const [limit, setLimit] = useState(100);

  const tokens = useMemo(
    () => tokenize(text, caseSensitive),
    [text, caseSensitive],
  );

  const ngramMap = useMemo(
    () => computeNgrams(tokens, n),
    [tokens, n],
  );

  const ngramRows: NgramRow[] = useMemo(() => {
    const rows: NgramRow[] = [];
    for (const [ngram, { tokens: toks, count }] of ngramMap) {
      if (count < minCount) continue;
      rows.push({ ngram, tokens: toks, count });
    }
    rows.sort((a, b) => b.count - a.count || a.ngram.localeCompare(b.ngram));
    return rows;
  }, [ngramMap, minCount]);

  const phraseFrames = useMemo(() => {
    // Filter ngramMap by minCount before frame computation? No - a frame's
    // total can exceed minCount even if each variant is below it. Use raw map
    // but skip n-grams with count 0 (none). Apply minCount on frame total.
    const frames = computePhraseFrames(ngramMap, n, slotPosition, minVariants);
    return frames.filter((f) => f.total >= minCount);
  }, [ngramMap, n, slotPosition, minVariants, minCount]);

  const filteredNgrams = useMemo(() => {
    if (!search.trim()) return ngramRows.slice(0, limit);
    const q = search.toLowerCase();
    return ngramRows
      .filter((r) => r.ngram.toLowerCase().includes(q))
      .slice(0, limit);
  }, [ngramRows, search, limit]);

  const filteredFrames = useMemo(() => {
    if (!search.trim()) return phraseFrames.slice(0, limit);
    const q = search.toLowerCase();
    return phraseFrames
      .filter(
        (f) =>
          f.skeleton.toLowerCase().includes(q) ||
          f.fillers.some((fi) => fi.word.toLowerCase().includes(q)),
      )
      .slice(0, limit);
  }, [phraseFrames, search, limit]);

  const totalTokens = tokens.length;
  const uniqueTokens = useMemo(
    () => new Set(tokens.map((t) => t.text)).size,
    [tokens],
  );

  return (
    <div className="mx-auto max-w-6xl">
      {/* Input */}
      <div className="rounded-xl border border-fd-border bg-fd-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-fd-foreground">
            Input text
          </label>
          <div className="text-xs text-fd-muted-foreground">
            {totalTokens.toLocaleString()} tokens · {uniqueTokens.toLocaleString()} unique
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-fd-border bg-fd-background p-3 text-sm font-mono focus:outline-none focus:border-fd-primary"
          placeholder="Paste any text here..."
        />
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            onClick={() => setText("")}
            className="text-xs rounded-md border border-fd-border px-2 py-1 hover:bg-fd-muted"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-fd-border bg-fd-card p-4 mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground mb-1">
            N (gram size)
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6, 7].map((v) => (
              <button
                key={v}
                onClick={() => setN(v)}
                className={`flex-1 rounded-md border px-2 py-1.5 text-sm font-medium transition-colors ${
                  n === v
                    ? "border-fd-primary bg-fd-primary text-fd-primary-foreground"
                    : "border-fd-border hover:bg-fd-muted"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground mb-1">
            Min count
          </label>
          <input
            type="number"
            min={1}
            value={minCount}
            onChange={(e) => setMinCount(Math.max(1, Number(e.target.value) || 1))}
            className="w-full rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-fd-muted-foreground mb-1">
            Max rows shown
          </label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="w-full rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-sm"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={250}>250</option>
            <option value={500}>500</option>
            <option value={2000}>2000</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 justify-end">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={(e) => setCaseSensitive(e.target.checked)}
              className="rounded"
            />
            <span className="text-fd-foreground">Case sensitive</span>
          </label>
        </div>
      </div>

      {/* View tabs */}
      <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <div className="flex rounded-lg border border-fd-border overflow-hidden">
          <button
            onClick={() => setView("ngrams")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              view === "ngrams"
                ? "bg-fd-primary text-fd-primary-foreground"
                : "hover:bg-fd-muted"
            }`}
          >
            N-grams ({ngramRows.length.toLocaleString()})
          </button>
          <button
            onClick={() => setView("frames")}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-fd-border ${
              view === "frames"
                ? "bg-fd-primary text-fd-primary-foreground"
                : "hover:bg-fd-muted"
            }`}
          >
            Phrase frames ({phraseFrames.length.toLocaleString()})
          </button>
        </div>

        <input
          type="text"
          placeholder="Filter…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-md border border-fd-border bg-fd-background px-3 py-2 text-sm"
        />

        <button
          onClick={() => {
            if (view === "ngrams") {
              downloadCSV("ngrams.csv", [
                ["ngram", "count"],
                ...filteredNgrams.map((r) => [r.ngram, String(r.count)]),
              ]);
            } else {
              downloadCSV("phrase-frames.csv", [
                ["frame", "slot_position", "total", "variants", "fillers"],
                ...filteredFrames.map((f) => [
                  f.skeleton,
                  String(f.position),
                  String(f.total),
                  String(f.fillers.length),
                  f.fillers.map((fi) => `${fi.word}:${fi.count}`).join(" | "),
                ]),
              ]);
            }
          }}
          className="rounded-md border border-fd-border px-3 py-2 text-sm hover:bg-fd-muted"
        >
          Export CSV
        </button>
      </div>

      {/* Frame-specific controls */}
      {view === "frames" && (
        <div className="rounded-lg border border-fd-border bg-fd-muted/30 p-3 mb-3 flex flex-wrap gap-4 items-center text-sm">
          <div className="flex items-center gap-2">
            <span className="text-fd-muted-foreground">Slot position:</span>
            <select
              value={slotPosition === "any" ? "any" : String(slotPosition)}
              onChange={(e) =>
                setSlotPosition(
                  e.target.value === "any" ? "any" : Number(e.target.value),
                )
              }
              className="rounded-md border border-fd-border bg-fd-background px-2 py-1"
            >
              <option value="any">any position</option>
              {Array.from({ length: n }, (_, i) => (
                <option key={i} value={i}>
                  position {i + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-fd-muted-foreground">Min variants:</span>
            <input
              type="number"
              min={2}
              value={minVariants}
              onChange={(e) =>
                setMinVariants(Math.max(2, Number(e.target.value) || 2))
              }
              className="w-16 rounded-md border border-fd-border bg-fd-background px-2 py-1"
            />
          </div>
          <div className="text-xs text-fd-muted-foreground italic">
            A phrase frame is an n-gram with one variable slot. e.g.{" "}
            <code className="font-mono">(intrat|impus) pe piața din românia</code>{" "}
            groups variants that share the same frame.
          </div>
        </div>
      )}

      {/* Results */}
      {view === "ngrams" ? (
        <div className="rounded-xl border border-fd-border bg-fd-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fd-border bg-fd-muted/50">
                <th className="text-left px-4 py-2 font-semibold">#</th>
                <th className="text-left px-4 py-2 font-semibold">N-gram</th>
                <th className="text-right px-4 py-2 font-semibold w-24">Count</th>
              </tr>
            </thead>
            <tbody>
              {filteredNgrams.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-fd-muted-foreground"
                  >
                    No n-grams match. Try lowering min count or clearing the filter.
                  </td>
                </tr>
              ) : (
                filteredNgrams.map((row, i) => (
                  <tr
                    key={row.ngram}
                    className="border-b border-fd-border last:border-0 hover:bg-fd-muted/30"
                  >
                    <td className="px-4 py-2 text-fd-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2 font-mono">{row.ngram}</td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {row.count}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-fd-border bg-fd-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-fd-border bg-fd-muted/50">
                <th className="text-left px-4 py-2 font-semibold">#</th>
                <th className="text-left px-4 py-2 font-semibold">Phrase frame</th>
                <th className="text-right px-4 py-2 font-semibold w-24">Variants</th>
                <th className="text-right px-4 py-2 font-semibold w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredFrames.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-fd-muted-foreground"
                  >
                    No phrase frames found. Try a smaller N, lower min count, or
                    lower min variants.
                  </td>
                </tr>
              ) : (
                filteredFrames.map((frame, i) => (
                  <tr
                    key={`${frame.position}-${frame.skeleton}`}
                    className="border-b border-fd-border last:border-0 hover:bg-fd-muted/30 align-top"
                  >
                    <td className="px-4 py-2 text-fd-muted-foreground">{i + 1}</td>
                    <td className="px-4 py-2">
                      <div className="font-mono">{renderFrameLabel(frame)}</div>
                      <details className="mt-1">
                        <summary className="text-xs text-fd-muted-foreground cursor-pointer hover:text-fd-foreground">
                          all {frame.fillers.length} fillers
                        </summary>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {frame.fillers.map((f) => (
                            <span
                              key={f.word}
                              className="inline-flex items-center gap-1 rounded-md border border-fd-border bg-fd-muted/50 px-1.5 py-0.5 text-xs font-mono"
                            >
                              {f.word}
                              <span className="text-fd-muted-foreground">
                                ×{f.count}
                              </span>
                            </span>
                          ))}
                        </div>
                      </details>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {frame.fillers.length}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {frame.total}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
