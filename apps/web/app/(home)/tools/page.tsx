"use client";

import { useState, useEffect, useCallback } from "react";

interface ClampValues {
  min: number;
  vw: number;
  base: number;
  max: number;
}

export default function Tools() {
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
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0]">
      <style jsx global>{`
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
        input[type="range"] {
          accent-color: #A1C548;
        }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-semibold mb-2">Clamp Calculator</h1>
        <p className="text-[#666] text-sm mb-8">
          Generate fluid responsive values from your Figma designs
        </p>

        {/* Calculator Card */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-5 mb-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-5">
            <button
              onClick={() => setMode("two")}
              className={`flex-1 py-2.5 px-3 rounded text-sm transition-all border ${
                mode === "two"
                  ? "border-[#A1C548] text-[#A1C548] bg-[#151515]"
                  : "border-[#333] text-[#666] bg-[#1a1a1a] hover:border-[#444] hover:text-[#888]"
              }`}
            >
              I have mobile + desktop
            </button>
            <button
              onClick={() => setMode("one")}
              className={`flex-1 py-2.5 px-3 rounded text-sm transition-all border ${
                mode === "one"
                  ? "border-[#A1C548] text-[#A1C548] bg-[#151515]"
                  : "border-[#333] text-[#666] bg-[#1a1a1a] hover:border-[#444] hover:text-[#888]"
              }`}
            >
              I only have desktop
            </button>
          </div>

          {/* Two Values Mode */}
          {mode === "two" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.7rem] text-[#555] uppercase tracking-wide mb-1.5">
                  Mobile value (430px)
                </label>
                <input
                  type="number"
                  value={mobile}
                  onChange={(e) => setMobile(Number(e.target.value))}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#A1C548]"
                />
              </div>
              <div>
                <label className="block text-[0.7rem] text-[#555] uppercase tracking-wide mb-1.5">
                  Desktop value (1440px)
                </label>
                <input
                  type="number"
                  value={desktop}
                  onChange={(e) => setDesktop(Number(e.target.value))}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#A1C548]"
                />
              </div>
            </div>
          )}

          {/* One Value Mode */}
          {mode === "one" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[0.7rem] text-[#555] uppercase tracking-wide mb-1.5">
                  Desktop value (1440px)
                </label>
                <input
                  type="number"
                  value={desktopOnly}
                  onChange={(e) => setDesktopOnly(Number(e.target.value))}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#A1C548]"
                />
              </div>
              <div>
                <label className="block text-[0.7rem] text-[#555] uppercase tracking-wide mb-1.5">
                  Min for mobile
                </label>
                <input
                  type="number"
                  value={minFloor}
                  onChange={(e) => setMinFloor(Number(e.target.value))}
                  className="w-full bg-[#0a0a0a] border border-[#333] rounded px-3 py-2.5 text-white font-mono focus:outline-none focus:border-[#A1C548]"
                />
              </div>
            </div>
          )}

          {/* Result */}
          <div className="mt-5 pt-5 border-t border-[#222]">
            <div
              onClick={copy}
              className="bg-[#0a0a0a] border border-dashed border-[#A1C548] rounded-md px-4 py-3.5 font-mono text-[#A1C548] cursor-pointer hover:bg-[#111] break-all"
            >
              {result}
            </div>
            <div className="text-[0.7rem] text-[#444] mt-2 text-right">click to copy</div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="bg-[#141414] border border-[#222] rounded-lg p-5">
          {/* Slider */}
          <div className="flex items-center gap-4 mb-3">
            <span className="font-mono text-sm text-[#888] w-12">320</span>
            <input
              type="range"
              min={320}
              max={2560}
              value={viewport}
              onChange={(e) => setViewport(Number(e.target.value))}
              className="flex-1"
            />
            <span className="font-mono text-sm text-[#888] w-12 text-right">2560</span>
          </div>

          {/* Preview Box */}
          <div className="bg-[#1a1a1a] rounded-md h-24 flex items-center justify-center relative">
            <span
              className="transition-all duration-75"
              style={{ fontSize: `${previewSize}px` }}
            >
              Aa
            </span>
            <span className="absolute bottom-2 right-3 font-mono text-xs text-[#A1C548]">
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
                  className="bg-[#1a1a1a] border border-[#222] rounded px-2.5 py-1.5 font-mono text-xs hover:border-[#444] transition-colors"
                >
                  <span className="text-[#666]">{bp}</span>
                  <strong className="text-[#ccc] ml-1">{val.toFixed(0)}px</strong>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Toast */}
      <div
        className={`fixed bottom-6 right-6 bg-[#A1C548] text-black px-4 py-2 rounded text-sm transition-opacity duration-200 ${
          toast ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        Copied!
      </div>
    </div>
  );
}
