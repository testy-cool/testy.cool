"use client";

import { useMemo, useState } from "react";

type Token = { text: string; raw: string; idx: number };

interface NgramRow {
  ngram: string;
  tokens: string[];
  count: number;
}

interface Filler {
  word: string;
  count: number;
}

interface PhraseFrame {
  core: string;
  tokens: string[];
  count: number;
  left: Filler[];
  right: Filler[];
}

/**
 * Tokenize text into lines of tokens.
 *
 * Hard boundaries (nothing can span them): newlines, markdown markers (*, _),
 * sentence-ending punctuation (. ! ? ; :), and brackets. This prevents ghost
 * n-grams like "foo bar" from appearing when the source was "foo **bar**".
 *
 * Commas are NOT boundaries — phrases commonly cross commas.
 * Hyphens and apostrophes inside words are preserved (don't, s-a).
 */
function tokenize(text: string, caseSensitive: boolean): Token[][] {
  const segmentRegex = /[^\n*_.!?;:[\](){}<>\\/|"`~]+/g;
  const wordRegex = /[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu;

  const lines: Token[][] = [];
  let seg: RegExpExecArray | null;
  while ((seg = segmentRegex.exec(text)) !== null) {
    const segText = seg[0];
    if (!segText.trim()) continue;
    const tokens: Token[] = [];
    let m: RegExpExecArray | null;
    wordRegex.lastIndex = 0;
    while ((m = wordRegex.exec(segText)) !== null) {
      const raw = m[0];
      tokens.push({
        raw,
        text: caseSensitive ? raw : raw.toLowerCase(),
        idx: seg.index + m.index,
      });
    }
    if (tokens.length > 0) lines.push(tokens);
  }
  return lines;
}

function computeNgrams(
  lines: Token[][],
  n: number,
): Map<string, { tokens: string[]; count: number }> {
  const map = new Map<string, { tokens: string[]; count: number }>();
  for (const tokens of lines) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const slice = tokens.slice(i, i + n).map((t) => t.text);
      const key = slice.join(" ");
      const existing = map.get(key);
      if (existing) existing.count++;
      else map.set(key, { tokens: slice, count: 1 });
    }
  }
  return map;
}

/**
 * Phrase frames = core n-gram + distribution of words to its left and right.
 *
 * Each row is one unique core. For every occurrence of the core in the text,
 * we look at the word immediately before (left context) and immediately after
 * (right context), staying inside line boundaries. The result shows the core
 * with fillers on either or both sides, e.g.
 *   (intrat|impus|pătruns) s-a impus pe piața (din|românească)
 */
function computeFrames(
  lines: Token[][],
  n: number,
): PhraseFrame[] {
  const cores = new Map<
    string,
    {
      tokens: string[];
      count: number;
      left: Map<string, number>;
      right: Map<string, number>;
    }
  >();

  for (const tokens of lines) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const slice = tokens.slice(i, i + n).map((t) => t.text);
      const key = slice.join(" ");
      let entry = cores.get(key);
      if (!entry) {
        entry = { tokens: slice, count: 0, left: new Map(), right: new Map() };
        cores.set(key, entry);
      }
      entry.count++;
      if (i > 0) {
        const lw = tokens[i - 1].text;
        entry.left.set(lw, (entry.left.get(lw) ?? 0) + 1);
      }
      if (i + n < tokens.length) {
        const rw = tokens[i + n].text;
        entry.right.set(rw, (entry.right.get(rw) ?? 0) + 1);
      }
    }
  }

  const frames: PhraseFrame[] = [];
  for (const [core, entry] of cores) {
    const left = Array.from(entry.left.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
    const right = Array.from(entry.right.entries())
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count);
    frames.push({
      core,
      tokens: entry.tokens,
      count: entry.count,
      left,
      right,
    });
  }

  return frames;
}

function renderFillerGroup(fillers: Filler[], maxShow = 4): string {
  if (fillers.length === 0) return "";
  const shown = fillers.slice(0, maxShow).map((f) => f.word);
  const more = fillers.length - shown.length;
  return "(" + shown.join("|") + (more > 0 ? `|+${more}` : "") + ")";
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
  const [n, setN] = useState(4);
  const [minCount, setMinCount] = useState(2);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [view, setView] = useState<"ngrams" | "frames">("frames");
  const [search, setSearch] = useState("");
  const [minVariants, setMinVariants] = useState(2);
  const [limit, setLimit] = useState(100);

  const lines = useMemo(
    () => tokenize(text, caseSensitive),
    [text, caseSensitive],
  );

  const totalTokens = useMemo(
    () => lines.reduce((s, l) => s + l.length, 0),
    [lines],
  );
  const uniqueTokens = useMemo(() => {
    const set = new Set<string>();
    for (const line of lines) for (const t of line) set.add(t.text);
    return set.size;
  }, [lines]);
  const segments = lines.length;

  const ngramMap = useMemo(() => computeNgrams(lines, n), [lines, n]);

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
    const all = computeFrames(lines, n);
    return all
      .filter((f) => {
        if (f.count < minCount) return false;
        const sideVariants = Math.max(f.left.length, f.right.length);
        return sideVariants >= minVariants;
      })
      .sort((a, b) => b.count - a.count);
  }, [lines, n, minCount, minVariants]);

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
          f.core.toLowerCase().includes(q) ||
          f.left.some((fi) => fi.word.toLowerCase().includes(q)) ||
          f.right.some((fi) => fi.word.toLowerCase().includes(q)),
      )
      .slice(0, limit);
  }, [phraseFrames, search, limit]);

  return (
    <div className="mx-auto max-w-6xl">
      {/* Input */}
      <div className="rounded-xl border border-fd-border bg-fd-card p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-fd-foreground">
            Input text
          </label>
          <div className="text-sm text-fd-muted-foreground">
            {totalTokens.toLocaleString()} tokens ·{" "}
            {uniqueTokens.toLocaleString()} unique ·{" "}
            {segments.toLocaleString()} segments
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
            className="text-sm rounded-md border border-fd-border px-2 py-1 hover:bg-fd-muted"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="rounded-xl border border-fd-border bg-fd-card p-4 mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="block text-sm font-semibold uppercase tracking-wider text-fd-muted-foreground mb-1">
            N (core size)
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
          <label className="block text-sm font-semibold uppercase tracking-wider text-fd-muted-foreground mb-1">
            Min count
          </label>
          <input
            type="number"
            min={1}
            value={minCount}
            onChange={(e) =>
              setMinCount(Math.max(1, Number(e.target.value) || 1))
            }
            className="w-full rounded-md border border-fd-border bg-fd-background px-2 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold uppercase tracking-wider text-fd-muted-foreground mb-1">
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
                ["core", "count", "left_variants", "right_variants", "left", "right"],
                ...filteredFrames.map((f) => [
                  f.core,
                  String(f.count),
                  String(f.left.length),
                  String(f.right.length),
                  f.left.map((fi) => `${fi.word}:${fi.count}`).join(" | "),
                  f.right.map((fi) => `${fi.word}:${fi.count}`).join(" | "),
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
          <div className="text-sm text-fd-muted-foreground italic">
            A phrase frame is a core n-gram with the words that appear on its
            left and right sides across the text. Min variants = the maximum
            of left/right distinct fillers must be ≥ this value.
          </div>
        </div>
      )}

      {/* Results */}
      {view === "ngrams" ? (
        <div className="rounded-xl border border-fd-border bg-fd-card overflow-hidden">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-fd-border bg-fd-muted/50">
                <th className="text-left px-4 py-2 font-semibold">#</th>
                <th className="text-left px-4 py-2 font-semibold">N-gram</th>
                <th className="text-right px-4 py-2 font-semibold w-24">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredNgrams.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-8 text-center text-fd-muted-foreground"
                  >
                    No n-grams match. Try lowering min count or clearing the
                    filter.
                  </td>
                </tr>
              ) : (
                filteredNgrams.map((row, i) => (
                  <tr
                    key={row.ngram}
                    className="border-b border-fd-border last:border-0 hover:bg-fd-muted/30"
                  >
                    <td className="px-4 py-2 text-fd-muted-foreground">
                      {i + 1}
                    </td>
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
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-fd-border bg-fd-muted/50">
                <th className="text-left px-4 py-2 font-semibold">#</th>
                <th className="text-left px-4 py-2 font-semibold">
                  Phrase frame
                </th>
                <th className="text-right px-4 py-2 font-semibold w-20">
                  Left
                </th>
                <th className="text-right px-4 py-2 font-semibold w-20">
                  Right
                </th>
                <th className="text-right px-4 py-2 font-semibold w-24">
                  Count
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFrames.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-fd-muted-foreground"
                  >
                    No phrase frames found. Try a smaller N, lower min count,
                    or lower min variants.
                  </td>
                </tr>
              ) : (
                filteredFrames.map((frame, i) => (
                  <tr
                    key={frame.core}
                    className="border-b border-fd-border last:border-0 hover:bg-fd-muted/30 align-top"
                  >
                    <td className="px-4 py-2 text-fd-muted-foreground">
                      {i + 1}
                    </td>
                    <td className="px-4 py-2">
                      <div className="font-mono">
                        {frame.left.length > 0 && (
                          <span className="text-fd-muted-foreground/70">
                            {renderFillerGroup(frame.left)}{" "}
                          </span>
                        )}
                        <span className="text-fd-foreground font-semibold">
                          {frame.core}
                        </span>
                        {frame.right.length > 0 && (
                          <span className="text-fd-muted-foreground/70">
                            {" "}
                            {renderFillerGroup(frame.right)}
                          </span>
                        )}
                      </div>
                      {(frame.left.length > 0 || frame.right.length > 0) && (
                        <details className="mt-1">
                          <summary className="text-sm text-fd-muted-foreground cursor-pointer hover:text-fd-foreground">
                            all fillers
                          </summary>
                          <div className="mt-2 space-y-2">
                            {frame.left.length > 0 && (
                              <div>
                                <div className="text-sm text-fd-muted-foreground mb-1">
                                  Left ({frame.left.length})
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {frame.left.map((f) => (
                                    <span
                                      key={f.word}
                                      className="inline-flex items-center gap-1 rounded-md border border-fd-border bg-fd-muted/50 px-1.5 py-0.5 text-sm font-mono"
                                    >
                                      {f.word}
                                      <span className="text-fd-muted-foreground">
                                        ×{f.count}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {frame.right.length > 0 && (
                              <div>
                                <div className="text-sm text-fd-muted-foreground mb-1">
                                  Right ({frame.right.length})
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {frame.right.map((f) => (
                                    <span
                                      key={f.word}
                                      className="inline-flex items-center gap-1 rounded-md border border-fd-border bg-fd-muted/50 px-1.5 py-0.5 text-sm font-mono"
                                    >
                                      {f.word}
                                      <span className="text-fd-muted-foreground">
                                        ×{f.count}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </details>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {frame.left.length}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {frame.right.length}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold">
                      {frame.count}
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
