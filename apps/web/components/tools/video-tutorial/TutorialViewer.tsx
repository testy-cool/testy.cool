"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import type {
  Tutorial,
  TutorialStep,
  TutorialBlock,
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
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const TAG_STYLES: Record<string, string> = {
  intro:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  concept: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300",
  setup:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  action:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
};

function BlockRenderer({ block }: { block: TutorialBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p
          className="text-fd-muted-foreground text-base leading-relaxed mb-3 [&_strong]:text-fd-foreground [&_code]:bg-fd-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:border [&_code]:border-fd-border"
          dangerouslySetInnerHTML={{ __html: block.html }}
        />
      );
    case "code":
      return (
        <pre className="bg-zinc-900 dark:bg-zinc-950 text-zinc-100 p-4 rounded-lg text-sm overflow-x-auto mb-3 border border-zinc-700">
          <code>{block.code}</code>
        </pre>
      );
    case "tldr":
      return (
        <div className="bg-red-50 dark:bg-red-950/20 border-l-4 border-red-400 dark:border-red-600 p-4 rounded-r-lg mb-3">
          <span className="font-bold text-red-700 dark:text-red-400">
            TL;DR:{" "}
          </span>
          <span
            className="text-red-900 dark:text-red-300"
            dangerouslySetInnerHTML={{ __html: block.html }}
          />
        </div>
      );
    case "concept":
      return (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-xl mb-3">
          <div className="font-bold text-blue-800 dark:text-blue-300 mb-2">
            {block.title}
          </div>
          <div
            className="text-blue-900 dark:text-blue-200 text-base"
            dangerouslySetInnerHTML={{ __html: block.html }}
          />
        </div>
      );
    case "list":
      return (
        <ul className="list-disc ml-5 mb-3 space-y-1">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="text-fd-muted-foreground text-base [&_strong]:text-fd-foreground"
              dangerouslySetInnerHTML={{ __html: item }}
            />
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
}: {
  step: TutorialStep;
  active: boolean;
  onSeek: (seconds: number) => void;
  stepRef: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      ref={stepRef}
      data-start={step.startSeconds}
      data-end={step.endSeconds}
      className={`rounded-xl border-2 p-6 mb-6 transition-all duration-300 origin-left ${
        active
          ? "border-fd-primary bg-fd-card shadow-lg opacity-100 scale-100"
          : "border-transparent bg-fd-card/60 opacity-40 scale-[0.98]"
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => onSeek(step.startSeconds)}
          className="bg-fd-primary text-white px-3 py-1 rounded-full text-sm font-bold hover:opacity-80 transition-opacity cursor-pointer flex items-center gap-1.5"
        >
          <span className="text-[10px]">&#9654;</span>
          {formatTime(step.startSeconds)}
        </button>
        <span
          className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${TAG_STYLES[step.tagType] || TAG_STYLES.action}`}
        >
          {step.tag}
        </span>
      </div>
      <h2 className="text-xl font-bold text-fd-foreground mb-4">
        {step.title}
      </h2>
      {step.blocks.map((block, i) => (
        <BlockRenderer key={i} block={block} />
      ))}
    </div>
  );
}

export default function TutorialViewer({ tutorial, onBack }: Props) {
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
      // Seek without forcing play — respects paused state
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

  return (
    <div
      className="flex flex-col lg:flex-row w-full"
      style={{ height: "calc(100dvh - 64px)" }}
    >
      {/* Video panel */}
      <div className="lg:w-1/2 w-full bg-black flex items-center justify-center shrink-0 min-h-[200px] lg:min-h-0 border-b lg:border-b-0 lg:border-r border-fd-border">
        <div className="w-full max-w-[900px] aspect-video p-3 lg:p-8">
          <div
            id="yt-player"
            className="w-full h-full rounded-xl overflow-hidden"
          />
        </div>
      </div>

      {/* Tutorial panel */}
      <div
        ref={scrollRef}
        onWheel={handleWheel}
        onScroll={handleScroll}
        className="lg:w-1/2 w-full overflow-y-auto p-5 lg:p-10 flex-1"
        style={{ paddingBottom: "50vh" }}
      >
        <button
          onClick={onBack}
          className="text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors mb-6"
        >
          &larr; New tutorial
        </button>

        <h1 className="text-2xl lg:text-3xl font-extrabold text-fd-foreground mb-2 tracking-tight">
          {tutorial.title}
        </h1>
        <p className="text-fd-muted-foreground mb-8 text-base">
          <strong className="text-fd-foreground">2-Way Sync:</strong> Scroll
          to scrub the video, or play to auto-scroll.
        </p>

        {tutorial.steps.map((step, i) => (
          <StepCard
            key={i}
            step={step}
            active={i === activeIndex}
            onSeek={seekTo}
            stepRef={(el) => {
              stepRefs.current[i] = el;
            }}
          />
        ))}
      </div>
    </div>
  );
}
