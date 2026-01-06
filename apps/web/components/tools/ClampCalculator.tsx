"use client";

import { useState, useEffect, useCallback } from "react";

interface ClampValues {
  min: number;
  vw: number;
  base: number;
  max: number;
}

export function ClampCalculator() {
  const [mode, setMode] = useState<"two" | "one">("two");
  const [mobile, setMobile] = useState(24);
  const [desktop, setDesktop] = useState(48);
  const [desktopOnly, setDesktopOnly] = useState(48);
  const [minFloor, setMinFloor] = useState(16);
  const [viewport, setViewport] = useState(1440);
  const [result, setResult] = useState("");
  const [clampValues, setClampValues] = useState<ClampValues>({
    min: 24,
    vw: 0,
    base: 0,
    max: 48,
  });
  const [toast, setToast] = useState(false);

  const calc = useCallback(() => {
    let resultStr: string;
    let min: number,
      max: number,
      vw: number,
      base = 0;

    if (mode === "two") {
      min = Math.min(mobile, desktop);
      max = Math.max(mobile, desktop);
      const slope = (desktop - mobile) / (1440 - 430);
      base = mobile - slope * 430;
      vw = slope * 100;

      if (Math.abs(base) < 0.5) {
        resultStr = `clamp(${min}px, ${vw.toFixed(2)}vw, ${max}px)`;
      } else if (base >= 0) {
        resultStr = `clamp(${min}px, ${vw.toFixed(2)}vw + ${base.toFixed(1)}px, ${max}px)`;
      } else {
        resultStr = `clamp(${min}px, ${vw.toFixed(2)}vw - ${Math.abs(base).toFixed(1)}px, ${max}px)`;
      }
    } else {
      min = minFloor;
      vw = (desktopOnly / 1440) * 100;
      max = Math.round((vw / 100) * 2560);
      base = 0;
      resultStr = `clamp(${min}px, ${vw.toFixed(2)}vw, ${max}px)`;
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
    <div className="not-prose my-8">
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

      <div className="bg-fd-card border border-fd-border rounded-lg p-5 mb-4">
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setMode("two")}
            className={`flex-1 py-2.5 px-3 rounded text-sm transition-all border ${
              mode === "two"
                ? "border-fd-primary text-fd-primary bg-fd-primary/5"
                : "border-fd-border text-fd-muted-foreground bg-fd-muted/50 hover:border-fd-border hover:text-fd-foreground"
            }`}
          >
            I have mobile + desktop
          </button>
          <button
            onClick={() => setMode("one")}
            className={`flex-1 py-2.5 px-3 rounded text-sm transition-all border ${
              mode === "one"
                ? "border-fd-primary text-fd-primary bg-fd-primary/5"
                : "border-fd-border text-fd-muted-foreground bg-fd-muted/50 hover:border-fd-border hover:text-fd-foreground"
            }`}
          >
            I only have desktop
          </button>
        </div>

        {/* Two Values Mode */}
        {mode === "two" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
                Mobile value (430px)
              </label>
              <input
                type="number"
                value={mobile}
                onChange={(e) => setMobile(Number(e.target.value))}
                className="w-full bg-fd-background border border-fd-border rounded px-3 py-2.5 font-mono focus:outline-none focus:border-fd-primary"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
                Desktop value (1440px)
              </label>
              <input
                type="number"
                value={desktop}
                onChange={(e) => setDesktop(Number(e.target.value))}
                className="w-full bg-fd-background border border-fd-border rounded px-3 py-2.5 font-mono focus:outline-none focus:border-fd-primary"
              />
            </div>
          </div>
        )}

        {/* One Value Mode */}
        {mode === "one" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
                Desktop value (1440px)
              </label>
              <input
                type="number"
                value={desktopOnly}
                onChange={(e) => setDesktopOnly(Number(e.target.value))}
                className="w-full bg-fd-background border border-fd-border rounded px-3 py-2.5 font-mono focus:outline-none focus:border-fd-primary"
              />
            </div>
            <div>
              <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
                Min for mobile
              </label>
              <input
                type="number"
                value={minFloor}
                onChange={(e) => setMinFloor(Number(e.target.value))}
                className="w-full bg-fd-background border border-fd-border rounded px-3 py-2.5 font-mono focus:outline-none focus:border-fd-primary"
              />
            </div>
          </div>
        )}

        {/* Result */}
        <div className="mt-5 pt-5 border-t border-fd-border">
          <div
            onClick={copy}
            className="bg-fd-background border border-dashed border-fd-primary rounded-md px-4 py-3.5 font-mono text-fd-primary cursor-pointer hover:bg-fd-primary/5 break-all transition-colors"
          >
            {result}
          </div>
          <div className="text-[0.7rem] text-fd-muted-foreground mt-2 text-right">
            click to copy
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-fd-card border border-fd-border rounded-lg p-5">
        <div className="flex items-center gap-4 mb-3">
          <span className="font-mono text-sm text-fd-muted-foreground w-12">
            320
          </span>
          <input
            type="range"
            min={320}
            max={2560}
            value={viewport}
            onChange={(e) => setViewport(Number(e.target.value))}
            className="flex-1 accent-fd-primary"
          />
          <span className="font-mono text-sm text-fd-muted-foreground w-12 text-right">
            2560
          </span>
        </div>

        <div className="bg-fd-muted rounded-md h-24 flex items-center justify-center relative">
          <span
            className="transition-all duration-75"
            style={{ fontSize: `${previewSize}px` }}
          >
            Aa
          </span>
          <span className="absolute bottom-2 right-3 font-mono text-xs text-fd-primary">
            {previewSize.toFixed(1)}px @ {viewport}px
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {breakpoints.map((bp) => {
            const val = getPreviewSize(bp);
            return (
              <button
                key={bp}
                onClick={() => setViewport(bp)}
                className="bg-fd-muted border border-fd-border rounded px-2.5 py-1.5 font-mono text-xs hover:border-fd-primary/50 transition-colors"
              >
                <span className="text-fd-muted-foreground">{bp}</span>
                <strong className="text-fd-foreground ml-1">
                  {val.toFixed(0)}px
                </strong>
              </button>
            );
          })}
        </div>
      </div>

      {/* Toast */}
      <div
        className={`fixed bottom-6 right-6 bg-fd-primary text-fd-primary-foreground px-4 py-2 rounded text-sm transition-opacity duration-200 z-50 ${
          toast ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        Copied!
      </div>
    </div>
  );
}

// Simple VW Calculator for teaching the formula
export function VwCalculator() {
  const [target, setTarget] = useState(48);
  const [baseWidth, setBaseWidth] = useState(1440);

  const vw = (target / baseWidth) * 100;

  return (
    <div className="not-prose my-6 bg-fd-card border border-fd-border rounded-lg p-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
            Target (px)
          </label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full bg-fd-background border border-fd-border rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-fd-primary"
          />
        </div>
        <div>
          <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
            Base viewport (px)
          </label>
          <input
            type="number"
            value={baseWidth}
            onChange={(e) => setBaseWidth(Number(e.target.value))}
            className="w-full bg-fd-background border border-fd-border rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-fd-primary"
          />
        </div>
      </div>
      <div className="bg-fd-muted rounded px-4 py-3 font-mono text-sm">
        <span className="text-fd-muted-foreground">{target} / {baseWidth} * 100 = </span>
        <strong className="text-fd-primary">{vw.toFixed(2)}vw</strong>
      </div>
    </div>
  );
}

// Live scaling preview
export function ScalingPreview() {
  const [viewport, setViewport] = useState(1024);

  // Example: 24px at 430px, 48px at 1440px
  const slope = (48 - 24) / (1440 - 430);
  const base = 24 - slope * 430;
  const vw = slope * 100;

  const getSize = (vp: number) => {
    const preferred = (vw / 100) * vp + base;
    return Math.max(24, Math.min(48, preferred));
  };

  const size = getSize(viewport);

  return (
    <div className="not-prose my-6 bg-fd-card border border-fd-border rounded-lg p-4">
      <div className="flex items-center gap-4 mb-4">
        <span className="font-mono text-xs text-fd-muted-foreground">430</span>
        <input
          type="range"
          min={430}
          max={1440}
          value={viewport}
          onChange={(e) => setViewport(Number(e.target.value))}
          className="flex-1 accent-fd-primary"
        />
        <span className="font-mono text-xs text-fd-muted-foreground">1440</span>
      </div>
      <div className="bg-fd-muted rounded-md h-20 flex items-center justify-center relative">
        <span style={{ fontSize: `${size}px` }} className="transition-all duration-75">
          Aa
        </span>
        <span className="absolute bottom-2 right-3 font-mono text-xs text-fd-primary">
          {size.toFixed(1)}px @ {viewport}px
        </span>
      </div>
      <p className="text-xs text-fd-muted-foreground mt-2 text-center">
        Drag to see how the font smoothly scales from 24px to 48px
      </p>
    </div>
  );
}

// Breakpoint vs Fluid comparison
export function BreakpointComparison() {
  const [viewport, setViewport] = useState(800);

  // Breakpoint approach: jumps at 768px
  const breakpointSize = viewport < 768 ? 24 : 48;

  // Fluid approach
  const slope = (48 - 24) / (1440 - 430);
  const base = 24 - slope * 430;
  const vw = slope * 100;
  const fluidSize = Math.max(24, Math.min(48, (vw / 100) * viewport + base));

  return (
    <div className="not-prose my-6 bg-fd-card border border-fd-border rounded-lg p-4">
      <div className="flex items-center gap-4 mb-4">
        <span className="font-mono text-xs text-fd-muted-foreground">430</span>
        <input
          type="range"
          min={430}
          max={1440}
          value={viewport}
          onChange={(e) => setViewport(Number(e.target.value))}
          className="flex-1 accent-fd-primary"
        />
        <span className="font-mono text-xs text-fd-muted-foreground">1440</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-fd-muted rounded-md h-20 flex flex-col items-center justify-center relative">
          <span className="text-[0.6rem] uppercase tracking-wide text-fd-muted-foreground absolute top-2">Breakpoints</span>
          <span style={{ fontSize: `${breakpointSize}px` }} className="transition-none">
            Aa
          </span>
          <span className="absolute bottom-2 font-mono text-xs text-fd-muted-foreground">
            {breakpointSize}px
          </span>
        </div>
        <div className="bg-fd-muted rounded-md h-20 flex flex-col items-center justify-center relative">
          <span className="text-[0.6rem] uppercase tracking-wide text-fd-muted-foreground absolute top-2">Fluid clamp()</span>
          <span style={{ fontSize: `${fluidSize}px` }} className="transition-all duration-75">
            Aa
          </span>
          <span className="absolute bottom-2 font-mono text-xs text-fd-primary">
            {fluidSize.toFixed(1)}px
          </span>
        </div>
      </div>

      <p className="text-xs text-fd-muted-foreground mt-3 text-center">
        Viewport: {viewport}px {viewport === 768 && <span className="text-fd-primary">(breakpoint!)</span>}
      </p>
    </div>
  );
}

// Two-point formula calculator
export function TwoPointCalculator() {
  const [mobileSize, setMobileSize] = useState(24);
  const [desktopSize, setDesktopSize] = useState(48);
  const [mobileVp, setMobileVp] = useState(430);
  const [desktopVp, setDesktopVp] = useState(1440);

  const slope = (desktopSize - mobileSize) / (desktopVp - mobileVp);
  const base = mobileSize - slope * mobileVp;
  const vw = slope * 100;

  const min = Math.min(mobileSize, desktopSize);
  const max = Math.max(mobileSize, desktopSize);

  let result: string;
  if (Math.abs(base) < 0.5) {
    result = `clamp(${min}px, ${vw.toFixed(2)}vw, ${max}px)`;
  } else if (base >= 0) {
    result = `clamp(${min}px, ${vw.toFixed(2)}vw + ${base.toFixed(1)}px, ${max}px)`;
  } else {
    result = `clamp(${min}px, ${vw.toFixed(2)}vw - ${Math.abs(base).toFixed(1)}px, ${max}px)`;
  }

  return (
    <div className="not-prose my-6 bg-fd-card border border-fd-border rounded-lg p-4">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
            Mobile size (px)
          </label>
          <input
            type="number"
            value={mobileSize}
            onChange={(e) => setMobileSize(Number(e.target.value))}
            className="w-full bg-fd-background border border-fd-border rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-fd-primary"
          />
        </div>
        <div>
          <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
            Desktop size (px)
          </label>
          <input
            type="number"
            value={desktopSize}
            onChange={(e) => setDesktopSize(Number(e.target.value))}
            className="w-full bg-fd-background border border-fd-border rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-fd-primary"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
            Mobile viewport (px)
          </label>
          <input
            type="number"
            value={mobileVp}
            onChange={(e) => setMobileVp(Number(e.target.value))}
            className="w-full bg-fd-background border border-fd-border rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-fd-primary"
          />
        </div>
        <div>
          <label className="block text-[0.7rem] text-fd-muted-foreground uppercase tracking-wide mb-1.5">
            Desktop viewport (px)
          </label>
          <input
            type="number"
            value={desktopVp}
            onChange={(e) => setDesktopVp(Number(e.target.value))}
            className="w-full bg-fd-background border border-fd-border rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-fd-primary"
          />
        </div>
      </div>

      <div className="bg-fd-muted rounded px-4 py-3 mb-3">
        <div className="text-xs text-fd-muted-foreground mb-2">
          <div>slope = ({desktopSize} - {mobileSize}) / ({desktopVp} - {mobileVp}) = <strong>{slope.toFixed(4)}</strong></div>
          <div>base = {mobileSize} - ({slope.toFixed(4)} * {mobileVp}) = <strong>{base.toFixed(2)}px</strong></div>
          <div>vw = {slope.toFixed(4)} * 100 = <strong>{vw.toFixed(2)}vw</strong></div>
        </div>
      </div>

      <div className="bg-fd-background border border-dashed border-fd-primary rounded-md px-4 py-3 font-mono text-fd-primary text-sm break-all">
        {result}
      </div>
    </div>
  );
}
