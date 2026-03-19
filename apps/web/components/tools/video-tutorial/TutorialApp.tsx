"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import type { Tutorial, TutorialSummary } from "@/lib/tools/video-tutorial/types";
import {
  parseVideoId,
  generateTutorial,
  getRecentTutorials,
} from "@/lib/tools/video-tutorial/tutorialService";
import TutorialViewer from "./TutorialViewer";

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

  // Viewer mode — full split view
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
            <div className="mt-10 text-center">
              <div className="inline-flex items-center gap-3 text-fd-muted-foreground">
                <span className="h-5 w-5 rounded-full border-2 border-fd-muted-foreground border-t-transparent animate-spin" />
                <span>Fetching transcript and generating tutorial...</span>
              </div>
              <p className="mt-2 text-sm text-fd-muted-foreground/60">
                This may take 15-30 seconds
              </p>
            </div>
          )}

          {/* Recent tutorials */}
          {recentTutorials.length > 0 && !isLoading && (
            <div className="mt-6">
              <span className="text-[13px] text-fd-muted-foreground/60">
                Recently generated:
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {recentTutorials.map((t) => (
                  <button
                    key={t.videoId}
                    onClick={() => handleGenerate(t.videoId)}
                    className="px-3 py-1.5 text-[13px] text-fd-muted-foreground rounded-full border border-fd-border/60 hover:border-fd-primary/40 hover:text-fd-foreground transition-colors text-left truncate max-w-[250px]"
                    title={`${t.stepCount} steps`}
                  >
                    {t.title}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
