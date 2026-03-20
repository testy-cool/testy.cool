"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import type {
  Tutorial,
  TutorialSummary,
  TutorialVersion,
} from "@/lib/tools/video-tutorial/types";
import {
  parseVideoId,
  generateTutorial,
  getRecentTutorials,
  getVersions,
  getVersion,
  getPrompt,
  updatePrompt,
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
  index,
}: {
  tutorial: TutorialSummary;
  onClick: () => void;
  index: number;
}) {
  return (
    <button
      onClick={onClick}
      className="vtg-card group text-left rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Thumbnail with overlay */}
      <div className="relative aspect-video overflow-hidden bg-zinc-900">
        <img
          src={`https://img.youtube.com/vi/${tutorial.videoId}/mqdefault.jpg`}
          alt={tutorial.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
        {/* Play icon on hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-xl">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M4 2l10 6-10 6V2z" fill="#18181b" />
            </svg>
          </div>
        </div>
        {/* Chapter count badge */}
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[11px] font-semibold text-white/90 tracking-wide">
          {tutorial.stepCount} ch
        </div>
        {/* Title overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5 pt-8">
          <h3 className="text-[13px] font-semibold text-white leading-snug line-clamp-2 drop-shadow-sm">
            {tutorial.title}
          </h3>
        </div>
      </div>
      {/* Meta bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-fd-card border border-t-0 border-fd-border/50 rounded-b-2xl">
        <span className="text-[11px] text-fd-muted-foreground/60 font-medium">
          {timeAgo(tutorial.timestamp)}
        </span>
        <span className="text-[11px] text-fd-primary/70 font-semibold tracking-wide uppercase group-hover:text-fd-primary transition-colors">
          Open
        </span>
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
  const [versions, setVersions] = useState<TutorialVersion[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number>(0);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [promptText, setPromptText] = useState("");
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptEditing, setPromptEditing] = useState(false);
  const [promptPassword, setPromptPassword] = useState("");
  const [promptShowPassword, setPromptShowPassword] = useState(false);
  const [promptStatus, setPromptStatus] = useState<string | null>(null);

  const previewId = useMemo(() => parseVideoId(input), [input]);
  const tutorialRef = useRef(tutorial);
  tutorialRef.current = tutorial;

  const handleGenerate = useCallback(async (videoIdOrUrl: string) => {
    const videoId = parseVideoId(videoIdOrUrl);
    if (!videoId) {
      setError("Invalid YouTube URL or video ID");
      return;
    }
    setError(null);
    setIsLoading(true);
    const prevTutorial = tutorialRef.current;

    // Only clear tutorial if it had valid steps (preserve empty-tutorial screen for retry)
    if (!prevTutorial || prevTutorial.steps.length > 0) {
      setTutorial(null);
    }

    try {
      const result = await generateTutorial(videoId);
      setTutorial(result);
      window.history.pushState(null, "", `?v=${videoId}`);
      getRecentTutorials().then(setRecentTutorials);
      getVersions(videoId).then((v) => {
        setVersions(v);
        if (v.length > 0) setCurrentVersion(v[v.length - 1]!.version);
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to generate tutorial");
      // If previous tutorial had empty steps, keep it so retry screen reappears
      if (prevTutorial && prevTutorial.steps.length === 0) {
        setTutorial(prevTutorial);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("v");
    if (v) handleGenerate(v);
    getRecentTutorials().then(setRecentTutorials);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const v = new URLSearchParams(window.location.search).get("v");
      if (!v) {
        setTutorial(null);
        setError(null);
        setIsLoading(false);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) handleGenerate(input.trim());
  };

  const handleBack = () => {
    setTutorial(null);
    setError(null);
    setVersions([]);
    setCurrentVersion(0);
    window.history.replaceState(null, "", window.location.pathname);
  };

  const handleRegenerate = useCallback(async () => {
    if (!tutorial) return;
    setError(null);
    setIsLoading(true);
    try {
      const result = await generateTutorial(tutorial.videoId, true);
      setTutorial(result);
      getVersions(tutorial.videoId).then((v) => {
        setVersions(v);
        if (v.length > 0) setCurrentVersion(v[v.length - 1]!.version);
      });
      getRecentTutorials().then(setRecentTutorials);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to regenerate");
    } finally {
      setIsLoading(false);
    }
  }, [tutorial]);

  const handleSelectVersion = useCallback(async (version: number) => {
    if (!tutorial) return;
    setIsLoading(true);
    try {
      const result = await getVersion(tutorial.videoId, version);
      setTutorial(result);
      setCurrentVersion(version);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load version");
    } finally {
      setIsLoading(false);
    }
  }, [tutorial]);

  const handleTogglePrompt = useCallback(async () => {
    if (showPromptEditor) {
      setShowPromptEditor(false);
      setPromptEditing(false);
      setPromptPassword("");
      setPromptShowPassword(false);
      setPromptStatus(null);
      return;
    }
    setShowPromptEditor(true);
    setPromptLoading(true);
    try {
      const text = await getPrompt();
      setPromptText(text);
    } catch {
      setPromptText("Failed to load prompt");
    } finally {
      setPromptLoading(false);
    }
  }, [showPromptEditor]);

  const handleSavePrompt = useCallback(async () => {
    setPromptStatus(null);
    try {
      await updatePrompt(promptText, promptPassword);
      setPromptStatus("Saved");
      setPromptEditing(false);
      setPromptPassword("");
      setPromptShowPassword(false);
    } catch (e: unknown) {
      setPromptStatus(e instanceof Error ? e.message : "Failed to save");
    }
  }, [promptText, promptPassword]);

  if (tutorial && tutorial.steps.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-5">
        <div className="max-w-md w-full text-center p-8 rounded-2xl border border-fd-border bg-fd-card">
          {isLoading ? (
            <>
              <div className="mx-auto mb-5 h-12 w-12 flex items-center justify-center">
                <span className="h-8 w-8 rounded-full border-2 border-fd-primary border-t-transparent animate-spin" />
              </div>
              <h2 className="text-lg font-semibold text-fd-foreground mb-2">
                Regenerating tutorial...
              </h2>
              <p className="text-base text-fd-muted-foreground/70">
                Analyzing video with Gemini. Usually takes 15-45 seconds.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto mb-5 h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-fd-foreground mb-2">
                This tutorial failed to generate properly.
              </h2>
              <p className="text-base text-fd-muted-foreground/70 mb-6">
                {error || "The video may be too short, private, or unsupported. You can try again or go back and pick a different video."}
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleBack}
                  className="px-5 py-2.5 rounded-xl border border-fd-border text-fd-muted-foreground text-[15px] font-medium hover:bg-fd-muted/50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => handleGenerate(tutorial.videoId)}
                  className="px-5 py-2.5 rounded-xl bg-fd-foreground text-fd-background text-[15px] font-semibold hover:opacity-80 transition-opacity"
                >
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  if (tutorial) {
    return (
      <TutorialViewer
        tutorial={tutorial}
        onBack={handleBack}
        onRegenerate={handleRegenerate}
        versions={versions}
        currentVersion={currentVersion}
        onSelectVersion={handleSelectVersion}
      />
    );
  }

  return (
    <>
      <style jsx global>{`
        @keyframes vtg-scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
        @keyframes vtg-card-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes vtg-pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(1.15); opacity: 0.1; }
        }
        .vtg-card {
          animation: vtg-card-in 0.5s ease-out both;
        }
        .vtg-scanline::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            transparent 0%,
            rgba(245, 158, 11, 0.08) 40%,
            rgba(245, 158, 11, 0.15) 50%,
            rgba(245, 158, 11, 0.08) 60%,
            transparent 100%
          );
          height: 60%;
          animation: vtg-scanline 2.5s ease-in-out infinite;
        }
        .vtg-input-glow:focus-within {
          box-shadow: 0 0 0 1px hsl(var(--fd-primary)),
                      0 0 20px -4px hsl(var(--fd-primary) / 0.25);
        }
      `}</style>

      <div className="min-h-screen">
        <section className="max-w-3xl lg:max-w-4xl mx-auto px-5 sm:px-8 pt-12 sm:pt-16 pb-20">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-[13px] text-fd-muted-foreground/50 mb-10">
            <Link href="/" className="hover:text-fd-foreground transition-colors">Home</Link>
            <span className="opacity-40">/</span>
            <Link href="/tools" className="hover:text-fd-foreground transition-colors">Tools</Link>
            <span className="opacity-40">/</span>
            <span className="text-fd-muted-foreground">Video Tutorial Generator</span>
          </nav>

          {/* Hero */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-fd-foreground tracking-tight leading-[1.1]">
            Video Tutorial
            <br />
            <span className="text-fd-muted-foreground/40">Generator</span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-fd-muted-foreground/70 max-w-md leading-relaxed">
            Paste a YouTube URL. Gemini watches the video and writes an interactive,
            scroll-synced text tutorial.
          </p>

          {/* Input */}
          <div className="mt-10 sm:mt-12">
            <div className="vtg-input-glow flex items-stretch rounded-2xl border border-fd-border bg-fd-card overflow-hidden transition-all duration-300">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="youtube.com/watch?v=... or video ID"
                disabled={isLoading}
                className="flex-1 px-5 py-4 text-[16px] bg-transparent text-fd-foreground placeholder:text-fd-muted-foreground/40 focus:outline-none disabled:opacity-50 min-w-0"
              />
              <button
                onClick={handleSubmit}
                disabled={isLoading || !input.trim()}
                className="px-7 py-4 bg-fd-foreground text-fd-background text-[15px] font-semibold hover:opacity-80 disabled:opacity-20 disabled:cursor-not-allowed transition-opacity shrink-0"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2.5">
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
                    Generating
                  </span>
                ) : (
                  "Generate"
                )}
              </button>
            </div>

            {/* View Prompt */}
            <div className="mt-3">
              <button
                onClick={handleTogglePrompt}
                className="text-[13px] text-fd-muted-foreground/40 hover:text-fd-muted-foreground transition-colors"
              >
                {showPromptEditor ? "Hide prompt" : "View prompt"}
              </button>
              {showPromptEditor && (
                <div className="mt-3 border border-fd-border rounded-xl overflow-hidden">
                  {promptLoading ? (
                    <div className="p-4 text-fd-muted-foreground/50 text-base">Loading...</div>
                  ) : (
                    <>
                      <textarea
                        value={promptText}
                        onChange={(e) => setPromptText(e.target.value)}
                        readOnly={!promptEditing}
                        className={`w-full p-4 bg-fd-card text-fd-foreground text-base font-mono leading-relaxed resize-y min-h-[200px] focus:outline-none ${
                          !promptEditing ? "opacity-70" : ""
                        }`}
                      />
                      <div className="flex items-center gap-3 px-4 py-3 border-t border-fd-border/50 bg-fd-card">
                        {!promptEditing ? (
                          <button
                            onClick={() => setPromptShowPassword(true)}
                            className="text-[13px] text-fd-muted-foreground/60 hover:text-fd-foreground transition-colors"
                          >
                            Edit
                          </button>
                        ) : (
                          <button
                            onClick={handleSavePrompt}
                            className="text-[13px] text-fd-primary font-medium hover:opacity-80 transition-opacity"
                          >
                            Save
                          </button>
                        )}
                        {promptShowPassword && !promptEditing && (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              if (promptPassword) {
                                setPromptEditing(true);
                                setPromptShowPassword(false);
                              }
                            }}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="password"
                              value={promptPassword}
                              onChange={(e) => setPromptPassword(e.target.value)}
                              placeholder="Password"
                              className="px-3 py-1.5 text-[13px] bg-transparent border border-fd-border rounded-lg text-fd-foreground placeholder:text-fd-muted-foreground/40 focus:outline-none focus:border-fd-primary/50"
                              autoFocus
                            />
                            <button
                              type="submit"
                              className="text-[13px] text-fd-primary font-medium hover:opacity-80 transition-opacity"
                            >
                              Unlock
                            </button>
                          </form>
                        )}
                        {promptEditing && (
                          <button
                            onClick={() => { setPromptEditing(false); setPromptPassword(""); }}
                            className="text-[13px] text-fd-muted-foreground/60 hover:text-fd-foreground transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        {promptStatus && (
                          <span className={`text-[13px] ml-auto ${promptStatus === "Saved" ? "text-green-500" : "text-red-500"}`}>
                            {promptStatus}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mt-6 p-4 rounded-xl border border-red-300/30 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 text-red-600 dark:text-red-400 text-base">
                {error}
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="mt-14 flex flex-col items-center">
                {previewId && (
                  <div className="vtg-scanline relative w-64 sm:w-80 aspect-video rounded-xl overflow-hidden shadow-2xl shadow-black/20 ring-1 ring-white/10">
                    <img
                      src={`https://img.youtube.com/vi/${previewId}/mqdefault.jpg`}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30" />
                  </div>
                )}
                <div className="mt-7 flex items-center gap-3">
                  {/* Pulse ring */}
                  <div className="relative flex items-center justify-center">
                    <span className="absolute h-8 w-8 rounded-full border border-fd-primary/30" style={{ animation: "vtg-pulse-ring 2s ease-in-out infinite" }} />
                    <span className="h-2.5 w-2.5 rounded-full bg-fd-primary" />
                  </div>
                  <span className="text-fd-muted-foreground text-[15px]">
                    Analyzing video with Gemini...
                  </span>
                </div>
                <p className="mt-2 text-[13px] text-fd-muted-foreground/40">
                  Usually takes 15-45 seconds
                </p>
              </div>
            )}

            {/* Recent tutorials */}
            {recentTutorials.length > 0 && !isLoading && (
              <div className="mt-14">
                <div className="flex items-center gap-3 mb-5">
                  <h2 className="text-[13px] font-semibold text-fd-muted-foreground/50 uppercase tracking-[0.1em]">
                    Recently generated
                  </h2>
                  <div className="flex-1 h-px bg-fd-border/50" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recentTutorials.map((t, i) => (
                    <RecentCard
                      key={t.videoId}
                      tutorial={t}
                      onClick={() => handleGenerate(t.videoId)}
                      index={i}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
