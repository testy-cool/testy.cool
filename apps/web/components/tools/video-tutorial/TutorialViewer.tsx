"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import DOMPurify from "dompurify";

const SANITIZE_CFG = { ALLOWED_TAGS: ['strong', 'code', 'em', 'ul', 'ol', 'li', 'br', 'p', 'span'] };
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
  versions?: TutorialVersion[];
  onSelectVersion?: (version: number) => void;
  currentVersion?: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}


function TimestampChip({
  timestamp,
  caption,
  frameData,
  onSeek,
}: {
  timestamp: number;
  caption: string;
  frameData?: string;
  onSeek: (s: number) => void;
}) {
  return (
    <div className="mb-3">
      {frameData && (
        <button
          onClick={() => onSeek(timestamp)}
          className="block mb-1.5 cursor-pointer group/frame"
        >
          <img
            src={`data:image/jpeg;base64,${frameData}`}
            alt={caption}
            className="w-[220px] rounded-lg border border-fd-border/50 group-hover/frame:border-fd-primary/40 transition-all duration-200 shadow-sm"
          />
        </button>
      )}
      <button
        onClick={() => onSeek(timestamp)}
        className="group flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg border border-fd-border/50 hover:border-fd-primary/40 bg-fd-card/50 hover:bg-fd-card transition-all duration-200 cursor-pointer"
      >
        {/* Film frame icon */}
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0 text-fd-muted-foreground/50 group-hover:text-fd-primary transition-colors">
          <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <rect x="3" y="1" width="2" height="3" rx="0.5" fill="currentColor" />
          <rect x="7" y="1" width="2" height="3" rx="0.5" fill="currentColor" />
          <rect x="11" y="1" width="2" height="3" rx="0.5" fill="currentColor" />
          <rect x="3" y="12" width="2" height="3" rx="0.5" fill="currentColor" />
          <rect x="7" y="12" width="2" height="3" rx="0.5" fill="currentColor" />
          <rect x="11" y="12" width="2" height="3" rx="0.5" fill="currentColor" />
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
  switch (block.type) {
    case "screenshot":
      return (
        <TimestampChip
          timestamp={block.timestamp}
          caption={block.caption}
          frameData={block.frameData}
          onSeek={onSeek}
        />
      );
    case "paragraph":
      return (
        <p
          className="text-fd-muted-foreground text-[15px] leading-[1.75] mb-4 [&_strong]:text-fd-foreground [&_strong]:font-semibold [&_code]:bg-fd-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-[13px] [&_code]:font-mono [&_code]:border [&_code]:border-fd-border/50"
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.html, SANITIZE_CFG) }}
        />
      );
    case "code":
      return (
        <pre className="bg-zinc-950 text-zinc-300 p-5 rounded-xl text-[13px] leading-relaxed overflow-x-auto mb-4 border border-zinc-800 font-mono">
          <code>{block.code}</code>
        </pre>
      );
    case "tldr":
      return (
        <div className="mb-5 pl-4 border-l border-fd-border/40">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fd-muted-foreground/40 mb-1 block">
            tl;dr
          </span>
          <div
            className="text-fd-foreground text-[15px] leading-relaxed italic"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.html, SANITIZE_CFG) }}
          />
        </div>
      );
    case "concept":
      return (
        <div className="mb-5 pl-4 border-l border-fd-border/40">
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fd-muted-foreground/40 mb-1 block">
            {block.title}
          </span>
          <div
            className="text-fd-muted-foreground text-[15px] leading-relaxed [&_strong]:text-fd-foreground"
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(block.html, SANITIZE_CFG) }}
          />
        </div>
      );
    case "list":
      return (
        <ul className="space-y-2 mb-4 pl-1">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex gap-2.5 text-fd-muted-foreground text-[15px] leading-relaxed [&_strong]:text-fd-foreground"
            >
              <span className="text-fd-primary mt-1.5 shrink-0 text-[8px]">&#9679;</span>
              <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(item, SANITIZE_CFG) }} />
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
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

function RegenerateButton({ onRegenerate }: { onRegenerate: () => void }) {
  return (
    <button
      onClick={onRegenerate}
      className="flex items-center gap-1.5 text-[12px] text-fd-muted-foreground/50 hover:text-fd-foreground transition-colors"
      title="Regenerate tutorial"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 4v4h4" />
        <path d="M3.51 10a5 5 0 1 0 .49-5.37L1 8" />
      </svg>
    </button>
  );
}

export default function TutorialViewer({ tutorial, onBack, onRegenerate, versions, onSelectVersion, currentVersion }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const userScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<number>(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [playerReady, setPlayerReady] = useState(false);

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

  // Video → text sync loop
  useEffect(() => {
    if (!playerReady) return;

    const interval = setInterval(() => {
      if (userScrollingRef.current || !playerRef.current?.getCurrentTime)
        return;

      const time = playerRef.current.getCurrentTime();
      const idx = tutorial.steps.findIndex((s, i) => {
        const next = tutorial.steps[i + 1];
        return time >= s.startSeconds && (next ? time < next.startSeconds : true);
      });

      if (idx >= 0 && idx !== activeIndex) {
        setActiveIndex(idx);
        stepRefs.current[idx]?.scrollIntoView({
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
    }, 150);
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
        <div className="lg:w-1/2 w-full bg-zinc-950 flex items-center justify-center shrink-0 min-h-[200px] lg:min-h-0">
          <div className="w-full max-w-[900px] aspect-video p-2 sm:p-3 lg:p-6">
            <div
              id="yt-player"
              className="w-full h-full rounded-lg lg:rounded-xl overflow-hidden"
            />
          </div>
        </div>

        {/* Tutorial panel */}
        <div className="lg:w-1/2 w-full flex-1 flex flex-col overflow-hidden border-l border-fd-border/30">
          {/* Progress rail */}
          <div className="h-0.5 w-full bg-fd-border/20 shrink-0">
            <div
              className="vtg-progress-rail h-full bg-fd-primary rounded-r-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>

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
              {onRegenerate && <RegenerateButton onRegenerate={onRegenerate} />}
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
            <p className="text-[13px] text-fd-muted-foreground/50 mb-8">
              Scroll to scrub the video, or play to auto-scroll.
            </p>

            {tutorial.steps.map((step, i) => (
              <StepCard
                key={i}
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
