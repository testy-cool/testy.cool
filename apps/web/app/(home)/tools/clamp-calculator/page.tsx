"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface ClampValues {
  min: number;
  vw: number;
  base: number;
  max: number;
}

export default function ClampCalculator() {
  const [mode, setMode] = useState<"two" | "one">("two");
  const [mobile, setMobile] = useState(16);
  const [desktop, setDesktop] = useState(30);
  const [desktopOnly, setDesktopOnly] = useState(30);
  const [minFloor, setMinFloor] = useState(16);
  const [viewport, setViewport] = useState(1440);
  const [result, setResult] = useState("");
  const [clampValues, setClampValues] = useState<ClampValues>({ min: 16, vw: 0, base: 0, max: 30 });
  const [toast, setToast] = useState(false);

  const calc = useCallback(() => {
    let resultStr: string;
    let min: number, max: number, vw: number, base = 0;

    if (mode === "two") {
      min = Math.min(mobile, desktop);
      max = Math.max(mobile, desktop);
      const slope = (desktop - mobile) / (1440 - 430);
      base = mobile - slope * 430;
      vw = slope * 100;

      if (Math.abs(base) < 0.5) {
        resultStr = `clamp(${min}px,${vw.toFixed(2)}vw,${max}px)`;
      } else if (base >= 0) {
        resultStr = `clamp(${min}px,${vw.toFixed(2)}vw+${base.toFixed(1)}px,${max}px)`;
      } else {
        resultStr = `clamp(${min}px,${vw.toFixed(2)}vw-${Math.abs(base).toFixed(1)}px,${max}px)`;
      }
    } else {
      min = minFloor;
      vw = (desktopOnly / 1440) * 100;
      max = Math.round((vw / 100) * 2560);
      base = 0;
      resultStr = `clamp(${min}px,${vw.toFixed(2)}vw,${max}px)`;
    }

    setClampValues({ min, vw, base, max });
    setResult(resultStr);
  }, [mode, mobile, desktop, desktopOnly, minFloor]);

  useEffect(() => {
    calc();
  }, [calc]);

  const getPreviewSize = (vp: number) => {
    const { min, vw, base, max } = clampValues;
    const preferred = (vw / 100) * vp + base;
    return Math.max(min, Math.min(max, preferred));
  };

  const copy = () => {
    navigator.clipboard.writeText(result);
    setToast(true);
    setTimeout(() => setToast(false), 1200);
  };

  const breakpoints = [320, 430, 768, 1024, 1440, 1920, 2560];
  const previewSize = getPreviewSize(viewport);

  return (
    <div className="min-h-screen">
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

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="text-sm text-muted-foreground mb-6">
          <Link href="/tools" className="hover:text-foreground transition-colors">
            Tools
          </Link>
          <span className="mx-2">/</span>
          <span>Clamp Calculator</span>
        </div>

        <h1 className="text-2xl font-semibold mb-2">Clamp Calculator</h1>
        <p className="text-muted-foreground text-sm mb-8">
          Generate fluid responsive values from your Figma designs
        </p>

        {/* Calculator Card */}
        <div className="bg-card border border-border rounded-lg p-5 mb-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setMode("two")}
              className={`flex-1 py-2.5 px-3 rounded text-sm transition-all border ${
                mode === "two"
                  ? "border-primary text-primary bg-primary/5"
                  : "border-border text-muted-foreground bg-muted/50 hover:border-border hover:text-foreground"
              }`}
            >
              I have mobile + desktop
            </button>
            <button
              onClick={() => setMode("one")}
              className={`flex-1 py-2.5 px-3 rounded text-sm transition-all border ${
                mode === "one"
                  ? "border-primary text-primary bg-primary/5"
                  : "border-border text-muted-foreground bg-muted/50 hover:border-border hover:text-foreground"
              }`}
            >
              I only have desktop
            </button>
          </div>

          {/* Two Values Mode */}
          {mode === "two" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.7rem] text-muted-foreground uppercase tracking-wide mb-1.5">
                  Mobile value (430px)
                </label>
                <input
                  type="number"
                  value={mobile}
                  onChange={(e) => setMobile(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded px-3 py-2.5 font-mono focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[0.7rem] text-muted-foreground uppercase tracking-wide mb-1.5">
                  Desktop value (1440px)
                </label>
                <input
                  type="number"
                  value={desktop}
                  onChange={(e) => setDesktop(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded px-3 py-2.5 font-mono focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* One Value Mode */}
          {mode === "one" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.7rem] text-muted-foreground uppercase tracking-wide mb-1.5">
                  Desktop value (1440px)
                </label>
                <input
                  type="number"
                  value={desktopOnly}
                  onChange={(e) => setDesktopOnly(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded px-3 py-2.5 font-mono focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-[0.7rem] text-muted-foreground uppercase tracking-wide mb-1.5">
                  Min for mobile
                </label>
                <input
                  type="number"
                  value={minFloor}
                  onChange={(e) => setMinFloor(Number(e.target.value))}
                  className="w-full bg-background border border-border rounded px-3 py-2.5 font-mono focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          {/* Result */}
          <div className="mt-5 pt-5 border-t border-border">
            <div
              onClick={copy}
              className="bg-background border border-dashed border-primary rounded-md px-4 py-3.5 font-mono text-primary cursor-pointer hover:bg-primary/5 break-all transition-colors"
            >
              {result}
            </div>
            <div className="text-[0.7rem] text-muted-foreground mt-2 text-right">click to copy</div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="bg-card border border-border rounded-lg p-5 mb-8">
          {/* Slider */}
          <div className="flex items-center gap-4 mb-3">
            <span className="font-mono text-sm text-muted-foreground w-12">320</span>
            <input
              type="range"
              min={320}
              max={2560}
              value={viewport}
              onChange={(e) => setViewport(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
            <span className="font-mono text-sm text-muted-foreground w-12 text-right">2560</span>
          </div>

          {/* Preview Box */}
          <div className="bg-muted rounded-md h-24 flex items-center justify-center relative">
            <span
              className="transition-all duration-75"
              style={{ fontSize: `${previewSize}px` }}
            >
              Aa
            </span>
            <span className="absolute bottom-2 right-3 font-mono text-xs text-primary">
              {previewSize.toFixed(1)}px @ {viewport}px
            </span>
          </div>

          {/* Breakpoints */}
          <div className="flex flex-wrap gap-2 mt-4">
            {breakpoints.map((bp) => {
              const val = getPreviewSize(bp);
              return (
                <button
                  key={bp}
                  onClick={() => setViewport(bp)}
                  className="bg-muted border border-border rounded px-2.5 py-1.5 font-mono text-xs hover:border-primary/50 transition-colors"
                >
                  <span className="text-muted-foreground">{bp}</span>
                  <strong className="text-foreground ml-1">{val.toFixed(0)}px</strong>
                </button>
              );
            })}
          </div>
        </div>

        {/* Explanation Section */}
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <h2>How it works</h2>

          <p>
            The CSS <code>clamp()</code> function lets values scale fluidly between a minimum and maximum,
            based on viewport width. Instead of jarring jumps at breakpoints, your typography and spacing
            smoothly transitions as the screen resizes.
          </p>

          <h3>The formula</h3>
          <pre className="bg-muted"><code>clamp(MIN, PREFERRED, MAX)</code></pre>
          <ul>
            <li><strong>MIN</strong> — The smallest the value can be (mobile floor)</li>
            <li><strong>PREFERRED</strong> — A viewport-relative value that scales (e.g., <code>2.08vw</code>)</li>
            <li><strong>MAX</strong> — The largest the value can be (desktop ceiling)</li>
          </ul>

          <h3>Two modes</h3>

          <h4>Mobile + Desktop (recommended)</h4>
          <p>
            When you have both mobile (430px) and desktop (1440px) values from your design, the calculator
            creates a linear equation that hits both points exactly. This gives you pixel-perfect matches
            at your design breakpoints.
          </p>

          <h4>Desktop only</h4>
          <p>
            When you only have the desktop measurement, the calculator uses simple linear scaling from 1440px.
            You set the minimum value manually to prevent text from getting too small on mobile.
          </p>

          <h3>When to use clamp()</h3>
          <ul>
            <li><strong>Font sizes</strong> — Headlines, body text, captions</li>
            <li><strong>Spacing</strong> — Padding, margins, gaps</li>
            <li><strong>Widths</strong> — Container widths, image sizes</li>
          </ul>

          <h3>Tips</h3>
          <ul>
            <li>For text, usually cap the MAX at your desktop design value — readers don&apos;t need 100px body text on 4K screens</li>
            <li>For spacing, you can let it grow larger on big screens (more breathing room is nice)</li>
            <li>Click the breakpoint chips below the preview to quickly check values at common viewport widths</li>
          </ul>

          <h3>In Tailwind</h3>
          <p>Use arbitrary values with square brackets:</p>
          <pre className="bg-muted"><code>{`<h1 class="text-[clamp(24px,5.64vw+3.73px,85px)]">
  Fluid heading
</h1>`}</code></pre>
        </div>
      </div>

      {/* Toast */}
      <div
        className={`fixed bottom-6 right-6 bg-primary text-primary-foreground px-4 py-2 rounded text-sm transition-opacity duration-200 ${
          toast ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        Copied!
      </div>
    </div>
  );
}
