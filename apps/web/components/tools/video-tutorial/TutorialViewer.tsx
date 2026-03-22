"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import DOMPurify from "dompurify";

// Allow all HTML/SVG, just strip scripts and event handlers
const SANITIZE_CFG = { ADD_TAGS: ['svg', 'path', 'rect', 'circle', 'line', 'text', 'g', 'defs', 'marker', 'polygon', 'polyline', 'ellipse', 'use', 'symbol', 'clipPath', 'linearGradient', 'radialGradient', 'stop', 'foreignObject', 'tspan'], ADD_ATTR: ['style', 'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset', 'd', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'transform', 'text-anchor', 'dominant-baseline', 'font-size', 'font-weight', 'opacity', 'marker-end', 'marker-start', 'points', 'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform', 'clip-path', 'colspan', 'rowspan'] };
import type {
  Tutorial,
  TutorialStep,
  TutorialBlock,
  TutorialVersion,
} from "@/lib/tools/video-tutorial/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}

interface Props {
  tutorial: Tutorial;
  onBack: () => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  regenerateError?: string | null;
  versions?: TutorialVersion[];
  onSelectVersion?: (version: number) => void;
  currentVersion?: number;
  pendingVersion?: number | null;
  onDismissPending?: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}


function TimestampChip({
  timestamp,
  caption,
  onSeek,
}: {
  timestamp: number;
  caption: string;
  onSeek: (s: number) => void;
}) {
  return (
    <div className="mb-3">
      <button
        onClick={() => onSeek(timestamp)}
        className="group flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg border border-fd-border/50 hover:border-fd-primary/40 bg-fd-card/50 hover:bg-fd-card transition-all duration-200 cursor-pointer"
      >
        {/* Play icon */}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-fd-muted-foreground/50 group-hover:text-fd-primary transition-colors">
          <path d="M5 3l8 5-8 5V3z" fill="currentColor" />
        </svg>
        {/* Timestamp badge */}
        <span className="shrink-0 px-1.5 py-0.5 rounded text-[11px] font-mono font-semibold bg-fd-primary/10 text-fd-primary">
          {formatTime(timestamp)}
        </span>
        {/* Caption */}
        <span className="text-[13px] text-fd-muted-foreground group-hover:text-fd-foreground transition-colors leading-snug truncate">
          {caption}
        </span>
      </button>
    </div>
  );
}

function BlockRenderer({
  block,
  onSeek,
}: {
  block: TutorialBlock;
  onSeek: (s: number) => void;
}) {
  // Screenshot: seek button
  if (block.type === "screenshot" && typeof block.timestamp === "number") {
    return (
      <TimestampChip
        timestamp={block.timestamp}
        caption={block.caption || ""}
        onSeek={onSeek}
      />
    );
  }

  // Code: syntax block
  if (block.type === "code" && block.code) {
    return (
      <pre className="bg-zinc-950 text-zinc-300 p-5 rounded-xl text-[13px] leading-relaxed overflow-x-auto mb-4 border border-zinc-800 font-mono">
        <code>{block.code}</code>
      </pre>
    );
  }

  // Everything else: render as freeform HTML
  const rawHtml = block.html;
  if (!rawHtml) return null;
  // Convert \n to <br> if the HTML doesn't already contain block-level tags
  const hasBlockTags = /<(div|p|table|ul|ol|h[1-6]|br|hr|svg)\b/i.test(rawHtml);
  const html = hasBlockTags ? rawHtml : rawHtml.replace(/\n/g, "<br>");

  return (
    <div className="mb-5">
      {block.caption && (
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fd-muted-foreground/40 mb-2 block">
          {block.caption}
        </span>
      )}
      <div
        className="visual-block font-sans text-[15px] leading-relaxed text-fd-muted-foreground [&_*]:font-sans [&_strong]:text-fd-foreground [&_strong]:font-semibold [&_code]:bg-fd-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-[13px] [&_code]:font-mono [&_code]:border [&_code]:border-fd-border/50 [&_table]:w-full [&_table]:text-[13px] [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-semibold [&_td]:px-4 [&_td]:py-2"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, SANITIZE_CFG) }}
      />
    </div>
  );
}

function StepCard({
  step,
  active,
  onSeek,
  stepRef,
  index,
  total,
}: {
  step: TutorialStep;
  active: boolean;
  onSeek: (seconds: number) => void;
  stepRef: (el: HTMLDivElement | null) => void;
  index: number;
  total: number;
}) {
  return (
    <div
      ref={stepRef}
      data-start={step.startSeconds}
      data-end={step.endSeconds}
      className={`vtg-step mb-8 transition-all duration-500 ${
        active ? "opacity-100" : "opacity-30"
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-2.5 mb-2">
        <button
          onClick={() => onSeek(step.startSeconds)}
          className="inline-flex items-center gap-1.5 text-[12px] font-mono text-fd-muted-foreground/50 hover:text-fd-primary transition-colors cursor-pointer"
        >
          {formatTime(step.startSeconds)}
        </button>
        <span className="text-[11px] uppercase tracking-[0.06em] text-fd-muted-foreground/40">
          {step.tag}
        </span>
        <span className="ml-auto text-[11px] text-fd-muted-foreground/25 font-mono tabular-nums">
          {index + 1}/{total}
        </span>
      </div>

      {/* Title */}
      <h2 className="text-[17px] font-semibold text-fd-foreground mb-3 leading-snug">
        {step.title}
      </h2>

      {/* Blocks */}
      {step.blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} onSeek={onSeek} />
      ))}

      {/* Separator */}
      <div className="h-px bg-fd-border/20 mt-6" />
    </div>
  );
}

function VersionDropdown({
  versions,
  currentVersion,
  onSelect,
}: {
  versions: TutorialVersion[];
  currentVersion: number;
  onSelect: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (versions.length <= 1) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-[11px] font-mono px-1.5 py-0.5 rounded border border-fd-border/50 text-fd-muted-foreground/60 hover:text-fd-foreground hover:border-fd-border transition-colors"
      >
        v{currentVersion}
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-1 z-50 min-w-[140px] py-1 rounded-lg border border-fd-border bg-fd-card shadow-lg">
          {versions.map((v) => (
            <button
              key={v.version}
              onClick={() => { onSelect(v.version); setOpen(false); }}
              className={`w-full text-left px-3 py-1.5 text-[12px] flex items-center justify-between gap-3 hover:bg-fd-muted/50 transition-colors ${
                v.version === currentVersion ? "text-fd-primary font-medium" : "text-fd-muted-foreground"
              }`}
            >
              <span>v{v.version}</span>
              <span className="text-[11px] text-fd-muted-foreground/40">
                {new Date(v.timestamp).toLocaleDateString()}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RegenerateButton({ onRegenerate, isRegenerating }: { onRegenerate: () => void; isRegenerating?: boolean }) {
  return (
    <button
      onClick={onRegenerate}
      disabled={isRegenerating}
      className="flex items-center gap-1.5 text-[12px] text-fd-muted-foreground/50 hover:text-fd-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      title="Regenerate tutorial"
    >
      <svg
        width="13"
        height="13"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={isRegenerating ? "animate-spin" : ""}
      >
        <path d="M1 4v4h4" />
        <path d="M3.51 10a5 5 0 1 0 .49-5.37L1 8" />
      </svg>
    </button>
  );
}

export default function TutorialViewer({ tutorial, onBack, onRegenerate, isRegenerating, regenerateError, versions, onSelectVersion, currentVersion, pendingVersion, onDismissPending }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const userScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number>(0);
  const suppressSyncRef = useRef(false);
  const suppressTimeoutRef = useRef<number>(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);

  // Suppress sync loop while regenerating
  useEffect(() => {
    if (isRegenerating) suppressSyncRef.current = true;
  }, [isRegenerating]);

  // Auto-dismiss pending version toast after 30s
  useEffect(() => {
    if (!pendingVersion) return;
    const timer = setTimeout(() => {
      onDismissPending?.();
    }, 30000);
    return () => clearTimeout(timer);
  }, [pendingVersion, onDismissPending]);

  // Load YouTube IFrame API and create player
  useEffect(() => {
    function create() {
      if (playerRef.current?.destroy) playerRef.current.destroy();
      playerRef.current = new window.YT!.Player("yt-player", {
        videoId: tutorial.videoId,
        playerVars: {
          playsinline: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: { onReady: () => setPlayerReady(true) },
      });
    }

    if (window.YT?.Player) {
      create();
    } else {
      window.onYouTubeIframeAPIReady = create;
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(tag);
      }
    }

    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy();
      playerRef.current = null;
    };
  }, [tutorial.videoId]);

  // Update document title + inject client-side JSON-LD
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${tutorial.title} — Interactive Tutorial | testy.cool`;

    // Inject JSON-LD if not already present from server
    if (!document.querySelector('script[data-vtg-jsonld]')) {
      const lastStep = tutorial.steps[tutorial.steps.length - 1];
      const dur = lastStep ? lastStep.endSeconds : 0;
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.setAttribute("data-vtg-jsonld", "true");
      script.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Article",
            headline: tutorial.title,
            description: `${tutorial.steps.length}-chapter interactive tutorial`,
            image: `https://img.youtube.com/vi/${tutorial.videoId}/maxresdefault.jpg`,
            datePublished: new Date(tutorial.generatedAt).toISOString(),
            publisher: { "@type": "Organization", name: "testy.cool", url: "https://testy.cool" },
          },
          {
            "@type": "VideoObject",
            name: tutorial.videoTitle,
            thumbnailUrl: `https://img.youtube.com/vi/${tutorial.videoId}/maxresdefault.jpg`,
            embedUrl: `https://www.youtube.com/embed/${tutorial.videoId}`,
            duration: `PT${Math.floor(dur / 60)}M${dur % 60}S`,
          },
        ],
      });
      document.head.appendChild(script);
    }

    return () => {
      document.title = prevTitle;
      document.querySelector('script[data-vtg-jsonld]')?.remove();
    };
  }, [tutorial]);

  // Reset to step 0 synchronously when tutorial changes (before paint)
  const [prevGeneratedAt, setPrevGeneratedAt] = useState(tutorial.generatedAt);
  if (tutorial.generatedAt !== prevGeneratedAt) {
    setPrevGeneratedAt(tutorial.generatedAt);
    setActiveIndex(0);
    // Suppress sync loop until video has seeked to new position
    suppressSyncRef.current = true;
    clearTimeout(suppressTimeoutRef.current);
  }

  // After reset, scroll to top and seek video, then release sync suppression
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(tutorial.steps[0]?.startSeconds ?? 0, true);
    }
    // Release sync suppression after video has had time to seek
    suppressTimeoutRef.current = window.setTimeout(() => {
      suppressSyncRef.current = false;
    }, 1000);
    return () => clearTimeout(suppressTimeoutRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prevGeneratedAt]);

  // Video → text sync loop
  useEffect(() => {
    if (!playerReady) return;

    const interval = setInterval(() => {
      if (suppressSyncRef.current) return;
      if (userScrollingRef.current || !playerRef.current?.getCurrentTime)
        return;

      const time = playerRef.current.getCurrentTime();
      const idx = tutorial.steps.findIndex((s, i) => {
        const next = tutorial.steps[i + 1];
        return time >= s.startSeconds && (next ? time < next.startSeconds : true);
      });

      const resolved = idx >= 0 ? idx : 0;
      if (resolved !== activeIndex) {
        setActiveIndex(resolved);
        stepRefs.current[resolved]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [playerReady, activeIndex, tutorial.steps]);

  // Text scroll → video seek
  const handleWheel = useCallback(() => {
    userScrollingRef.current = true;
  }, []);

  const handleScroll = useCallback(() => {
    if (!userScrollingRef.current || !playerRef.current?.seekTo) return;

    clearTimeout(scrollTimeoutRef.current);

    const container = scrollRef.current;
    if (!container) return;

    // If scrolled to the very top, force first section active
    if (container.scrollTop <= 10) {
      if (activeIndex !== 0) {
        setActiveIndex(0);
        playerRef.current.seekTo(tutorial.steps[0].startSeconds, true);
      }
      scrollTimeoutRef.current = window.setTimeout(() => {
        userScrollingRef.current = false;
      }, 150);
      return;
    }

    const center =
      container.getBoundingClientRect().top + container.clientHeight / 2;
    let closestIdx = 0;
    let closestDist = Infinity;

    stepRefs.current.forEach((el, i) => {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const dist = Math.abs(rect.top + rect.height / 2 - center);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    });

    if (closestIdx !== activeIndex) {
      setActiveIndex(closestIdx);
      playerRef.current.seekTo(
        tutorial.steps[closestIdx].startSeconds,
        true,
      );
    }

    scrollTimeoutRef.current = window.setTimeout(() => {
      userScrollingRef.current = false;
    }, 1500);
  }, [activeIndex, tutorial.steps]);

  const seekTo = useCallback((seconds: number) => {
    userScrollingRef.current = false;
    if (playerRef.current?.seekTo) {
      playerRef.current.seekTo(seconds, true);
      playerRef.current.playVideo();
    }
  }, []);

  const progressPct =
    tutorial.steps.length > 0
      ? ((activeIndex + 1) / tutorial.steps.length) * 100
      : 0;

  return (
    <>
      <style jsx global>{`
        .vtg-step {
          will-change: opacity, transform;
        }
        .vtg-progress-rail {
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .vtg-scroll::-webkit-scrollbar {
          width: 4px;
        }
        .vtg-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .vtg-scroll::-webkit-scrollbar-thumb {
          background: hsl(var(--fd-border));
          border-radius: 99px;
        }
      `}</style>

      <div
        className="flex flex-col lg:flex-row w-full"
        style={{ height: "calc(100dvh - 64px)" }}
      >
        {/* Video panel */}
        <div className="lg:w-[60%] w-full bg-zinc-950 flex items-center justify-center shrink-0 min-h-[240px] lg:min-h-0">
          <div className="w-full h-full p-2 sm:p-3 lg:p-4">
            <div
              id="yt-player"
              className="w-full h-full rounded-lg overflow-hidden"
            />
          </div>
        </div>

        {/* Tutorial panel */}
        <div className="lg:w-[40%] w-full flex-1 flex flex-col overflow-hidden border-l border-fd-border/30">
          {/* Progress rail */}
          <div className="h-0.5 w-full bg-fd-border/20 shrink-0">
            <div
              className="vtg-progress-rail h-full bg-fd-primary rounded-r-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Regenerating banner */}
          {isRegenerating && (
            <div className="flex items-center gap-2 px-5 lg:px-8 py-2.5 border-b border-fd-border/20 shrink-0 text-[13px] text-fd-muted-foreground">
              <span className="h-3.5 w-3.5 rounded-full border-[1.5px] border-fd-primary border-t-transparent animate-spin shrink-0" />
              Regenerating with Gemini — you'll be switched automatically when ready
            </div>
          )}

          {/* Regeneration error banner */}
          {regenerateError && !isRegenerating && (
            <div className="flex items-center gap-2 px-5 lg:px-8 py-2.5 border-b border-red-300/20 dark:border-red-900/20 shrink-0 text-[13px] text-red-500">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0">
                <circle cx="8" cy="8" r="6.5" />
                <path d="M8 5v3M8 10.5v.5" />
              </svg>
              {regenerateError}
            </div>
          )}

          {/* Regenerated success banner */}
          {pendingVersion && !isRegenerating && !regenerateError && (
            <div className="flex items-center justify-between px-5 lg:px-8 py-2 border-b border-fd-border/20 shrink-0 text-[13px] text-fd-muted-foreground">
              Switched to v{pendingVersion}. Previous versions in the dropdown.
              <button
                onClick={onDismissPending}
                className="text-fd-muted-foreground/40 hover:text-fd-muted-foreground transition-colors p-0.5 ml-3"
              >
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>
          )}

          {/* Top bar */}
          <div className="flex items-center justify-between px-5 lg:px-8 py-3 border-b border-fd-border/30 shrink-0">
            <button
              onClick={onBack}
              className="text-[13px] text-fd-muted-foreground/60 hover:text-fd-foreground transition-colors flex items-center gap-1.5"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 4l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
            <div className="flex items-center gap-3">
              {onRegenerate && <RegenerateButton onRegenerate={onRegenerate} isRegenerating={isRegenerating} />}
              {versions && versions.length > 1 && onSelectVersion && currentVersion && (
                <VersionDropdown versions={versions} currentVersion={currentVersion} onSelect={onSelectVersion} />
              )}
              <div className="text-[12px] text-fd-muted-foreground/40 font-mono tabular-nums">
                {activeIndex + 1} of {tutorial.steps.length} chapters
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div
            ref={scrollRef}
            onWheel={handleWheel}
            onScroll={handleScroll}
            className="vtg-scroll flex-1 overflow-y-auto px-5 lg:px-8 pt-6"
            style={{ paddingBottom: "50vh" }}
          >
            <h1 className="text-xl lg:text-2xl font-extrabold text-fd-foreground mb-1.5 tracking-tight leading-snug">
              {tutorial.title}
            </h1>
            {tutorial.summary && (
              <div className="mb-6 pl-4 border-l-2 border-fd-border/40">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fd-muted-foreground/40 mb-1.5 block">
                  tl;dr
                </span>
                <div
                  className="text-base text-fd-muted-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tutorial.summary.replace(/\n/g, "<br>"), SANITIZE_CFG) }}
                />
              </div>
            )}
            <p className="text-[12px] text-fd-muted-foreground/40 mb-8">
              Scroll to scrub the video, or play to auto-scroll.
            </p>

            {tutorial.steps.map((step, i) => (
              <StepCard
                key={`${tutorial.generatedAt}-${i}`}
                step={step}
                active={i === activeIndex}
                onSeek={seekTo}
                index={i}
                total={tutorial.steps.length}
                stepRef={(el) => {
                  stepRefs.current[i] = el;
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
