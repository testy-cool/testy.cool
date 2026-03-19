"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type {
  Tutorial,
  TutorialSummary,
} from "@/lib/tools/video-tutorial/types";
import {
  parseVideoId,
  generateTutorial,
  getRecentTutorials,
} from "@/lib/tools/video-tutorial/tutorialService";
import TutorialViewer from "./TutorialViewer";

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function RecentCard({
  tutorial,
  onClick,
}: {
  tutorial: TutorialSummary;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-xl border border-fd-border bg-fd-card overflow-hidden hover:border-fd-primary/40 transition-all hover:shadow-md"
    >
      {/* Thumbnail */}
      <div className="aspect-video overflow-hidden bg-fd-muted">
        <img
          src={`https://img.youtube.com/vi/${tutorial.videoId}/mqdefault.jpg`}
          alt={tutorial.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      {/* Info */}
      <div className="p-3.5">
        <h3 className="text-sm font-semibold text-fd-foreground leading-snug line-clamp-2 group-hover:text-fd-primary transition-colors">
          {tutorial.title}
        </h3>
        <div className="mt-2 flex items-center gap-1.5 text-[12px] text-fd-muted-foreground/70">
          <span className="inline-flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 16 16"
              fill="none"
              className="opacity-60"
            >
              <rect
                x="1"
                y="3"
                width="14"
                height="10"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M5 1v4M11 1v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {tutorial.stepCount} chapters
          </span>
          <span className="opacity-40">·</span>
          <span>{timeAgo(tutorial.timestamp)}</span>
        </div>
      </div>
    </button>
  );
}

export default function TutorialApp() {
  const [tutorial, setTutorial] = useState<Tutorial | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [recentTutorials, setRecentTutorials] = useState<TutorialSummary[]>([]);

  const handleGenerate = useCallback(async (videoIdOrUrl: string) => {
    const videoId = parseVideoId(videoIdOrUrl);
    if (!videoId) {
      setError("Invalid YouTube URL or video ID");
      return;
    }
    setError(null);
    setIsLoading(true);
    setTutorial(null);

    try {
      const result = await generateTutorial(videoId);
      setTutorial(result);
      window.history.replaceState(null, "", `?v=${videoId}`);
      getRecentTutorials().then(setRecentTutorials);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate tutorial");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load from URL params or recent list on mount
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("v");
    if (v) handleGenerate(v);
    getRecentTutorials().then(setRecentTutorials);
  }, [handleGenerate]);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) handleGenerate(input.trim());
  };

  const handleBack = () => {
    setTutorial(null);
    setError(null);
    window.history.replaceState(null, "", window.location.pathname);
  };

  // Viewer mode
  if (tutorial) {
    return <TutorialViewer tutorial={tutorial} onBack={handleBack} />;
  }

  // Input mode
  return (
    <div className="min-h-screen">
      <section className="max-w-3xl lg:max-w-4xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-16">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-[13px] text-fd-muted-foreground/60 mb-8">
          <Link
            href="/"
            className="hover:text-fd-foreground transition-colors"
          >
            Home
          </Link>
          <span>/</span>
          <Link
            href="/tools"
            className="hover:text-fd-foreground transition-colors"
          >
            Tools
          </Link>
          <span>/</span>
          <span className="text-fd-muted-foreground">
            Video Tutorial Generator
          </span>
        </nav>

        {/* Hero */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-fd-foreground tracking-tight">
          Video Tutorial Generator
        </h1>
        <p className="mt-3 text-base sm:text-lg text-fd-muted-foreground max-w-lg">
          Paste a YouTube URL. Get an interactive, scroll-synced text tutorial.
        </p>

        {/* Input */}
        <div className="mt-8 sm:mt-10">
          <div className="flex items-stretch rounded-xl border border-fd-border bg-fd-card shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-fd-primary focus-within:border-transparent transition-shadow">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="youtube.com/watch?v=... or video ID"
              disabled={isLoading}
              className="flex-1 px-5 py-3.5 text-[16px] bg-transparent text-fd-foreground placeholder:text-fd-muted-foreground/60 focus:outline-none disabled:opacity-50 min-w-0"
            />
            <button
              onClick={handleSubmit}
              disabled={isLoading || !input.trim()}
              className="px-6 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[15px] font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                  Generating
                </span>
              ) : (
                "Generate"
              )}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-base">
              {error}
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="mt-12 text-center">
              {/* Thumbnail preview while loading */}
              {input && parseVideoId(input) && (
                <div className="mx-auto w-48 aspect-video rounded-lg overflow-hidden mb-5 opacity-60 shadow-sm">
                  <img
                    src={`https://img.youtube.com/vi/${parseVideoId(input)}/mqdefault.jpg`}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="inline-flex items-center gap-3 text-fd-muted-foreground">
                <span className="h-5 w-5 rounded-full border-2 border-fd-muted-foreground border-t-transparent animate-spin" />
                <span>Watching video and generating tutorial...</span>
              </div>
              <p className="mt-2 text-sm text-fd-muted-foreground/60">
                Gemini is analyzing the video. This takes 15-45 seconds.
              </p>
            </div>
          )}

          {/* Recent tutorials */}
          {recentTutorials.length > 0 && !isLoading && (
            <div className="mt-10">
              <h2 className="text-sm font-semibold text-fd-muted-foreground uppercase tracking-wider mb-4">
                Recently generated
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recentTutorials.map((t) => (
                  <RecentCard
                    key={t.videoId}
                    tutorial={t}
                    onClick={() => handleGenerate(t.videoId)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
