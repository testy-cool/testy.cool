"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import DOMPurify from "dompurify";
import { chatWithTutorial, getConversations, getConversation } from "@/lib/tools/video-breakdown/tutorialService";
import type { ConversationSummary } from "@/lib/tools/video-breakdown/tutorialService";

// Allow all HTML/SVG, just strip scripts and event handlers
const SANITIZE_CFG = { ADD_TAGS: ['svg', 'path', 'rect', 'circle', 'line', 'text', 'g', 'defs', 'marker', 'polygon', 'polyline', 'ellipse', 'use', 'symbol', 'clipPath', 'linearGradient', 'radialGradient', 'stop', 'foreignObject', 'tspan'], ADD_ATTR: ['style', 'viewBox', 'xmlns', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-dasharray', 'stroke-dashoffset', 'd', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r', 'rx', 'ry', 'width', 'height', 'transform', 'text-anchor', 'dominant-baseline', 'font-size', 'font-weight', 'opacity', 'marker-end', 'marker-start', 'points', 'offset', 'stop-color', 'stop-opacity', 'gradientUnits', 'gradientTransform', 'clip-path', 'colspan', 'rowspan'] };
import type {
  Tutorial,
  TutorialStep,
  TutorialBlock,
  TutorialVersion,
} from "@/lib/tools/video-breakdown/types";

function simpleMarkdown(text: string): string {
  return text
    .replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => `<pre><code class="language-${lang}">${code.replace(/</g, "&lt;")}</code></pre>`)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    .replace(/<p><(h[123]|ul|ol|pre)/g, "<$1")
    .replace(/<\/(h[123]|ul|ol|pre)><\/p>/g, "</$1>");
}

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
  _dbg?: boolean;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
  regenerateError?: string | null;
  versions?: TutorialVersion[];
  onSelectVersion?: (version: number) => void;
  currentVersion?: number;
  pendingVersion?: number | null;
  onDismissPending?: () => void;
}

function formatUsd(cost?: number): string {
  if (!cost) return "$0.00";
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

function SignalBadge({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value?: string;
  tone?: "good" | "warn" | "bad" | "neutral";
}) {
  if (!value) return null;
  const toneClass =
    tone === "good"
      ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : tone === "warn"
        ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : tone === "bad"
          ? "border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400"
          : "border-fd-border/50 bg-fd-card text-fd-foreground/70";
  return (
    <div className={`rounded-xl border px-3 py-2 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-[0.08em] opacity-70 mb-1">{label}</div>
      <div className="text-[13px] font-semibold">{value}</div>
    </div>
  );
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
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fd-muted-foreground/60 mb-2 block">
          {block.caption}
        </span>
      )}
      <div
        className="visual-block font-sans text-[15px] leading-relaxed text-fd-foreground/80 [&_*]:font-sans [&_strong]:text-fd-foreground [&_strong]:font-semibold [&_code]:bg-fd-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-[13px] [&_code]:font-mono [&_code]:border [&_code]:border-fd-border/50 [&_table]:w-full [&_table]:text-[13px] [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-left [&_th]:font-semibold [&_td]:px-4 [&_td]:py-2"
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html, SANITIZE_CFG) }}
      />
    </div>
  );
}

function ChatPanel({ videoId }: { videoId: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [viewingConv, setViewingConv] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load existing conversations
  useEffect(() => {
    getConversations(videoId).then(setConversations);
  }, [videoId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput("");
    setViewingConv(null);
    const newMessages = [...messages, { role: "user", text: msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const { reply, convId: returnedId } = await chatWithTutorial(
        videoId, msg, messages, convId || undefined, parentId || undefined,
      );
      if (!convId) setConvId(returnedId);
      if (parentId) setParentId(null); // clear after first branched message
      setMessages([...newMessages, { role: "model", text: reply }]);
      getConversations(videoId).then(setConversations);
    } catch (e: unknown) {
      setMessages([...newMessages, { role: "model", text: `Error: ${e instanceof Error ? e.message : "Failed"}` }]);
    } finally {
      setLoading(false);
    }
  };

  const loadConversation = async (id: string) => {
    const conv = await getConversation(videoId, id);
    if (!conv) return;
    setMessages(conv.messages);
    setViewingConv(id);
    setConvId(null); // viewing, not continuing yet
    setParentId(null);
    setOpen(true);
  };

  const branchConversation = () => {
    if (!viewingConv) return;
    setParentId(viewingConv);
    setConvId(null); // new conv will be created on first send
    setViewingConv(null);
  };

  const startNew = () => {
    setMessages([]);
    setConvId(null);
    setParentId(null);
    setViewingConv(null);
    setOpen(true);
  };

  if (!open) {
    return (
      <div className="mt-4 mb-8 space-y-3">
        <button
          onClick={startNew}
          className="w-full py-3 rounded-xl border border-fd-border/50 text-[13px] text-fd-muted-foreground/60 hover:text-fd-foreground hover:border-fd-border transition-colors flex items-center justify-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h12v8H5l-3 3V3z" />
          </svg>
          Ask a question about this video
        </button>
        {conversations.length > 0 && (
          <div className="space-y-1">
            <span className="text-[11px] text-fd-muted-foreground/30 uppercase tracking-wider">Previous conversations</span>
            {conversations.slice(0, 5).map((c) => (
              <button
                key={c.id}
                onClick={() => loadConversation(c.id)}
                className="w-full text-left px-3 py-2 rounded-lg border border-fd-border/30 hover:border-fd-border/60 transition-colors flex items-center justify-between gap-2"
              >
                <span className="text-[13px] text-fd-muted-foreground/70 truncate">{c.preview}</span>
                <span className="text-[11px] text-fd-muted-foreground/30 shrink-0">{c.messageCount} msgs</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 mb-8 rounded-xl border border-fd-border/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-fd-border/30 bg-fd-card">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-medium text-fd-muted-foreground/60 uppercase tracking-wider">Chat</span>
          {viewingConv && (
            <button
              onClick={branchConversation}
              className="text-[11px] text-fd-primary/70 hover:text-fd-primary transition-colors font-medium"
            >
              Continue (branch)
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          {(messages.length > 0 || viewingConv) && (
            <button onClick={startNew} className="text-[11px] text-fd-muted-foreground/40 hover:text-fd-muted-foreground transition-colors">
              New
            </button>
          )}
          <button onClick={() => setOpen(false)} className="text-fd-muted-foreground/40 hover:text-fd-muted-foreground transition-colors">
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        </div>
      </div>
      <div className="max-h-[400px] overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-[13px] text-fd-muted-foreground/40 text-center py-4">
            Ask anything about the video content or transcript.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`text-[14px] leading-relaxed ${m.role === "user" ? "text-fd-foreground" : "text-fd-foreground/70"}`}>
            <span className="text-[11px] font-medium uppercase tracking-wider text-fd-muted-foreground/40 block mb-1">
              {m.role === "user" ? "You" : "AI"}
            </span>
            {m.role === "user" ? (
              <div className="whitespace-pre-wrap">{m.text}</div>
            ) : (
              <div
                className="vtg-chat-md prose prose-sm prose-invert max-w-none [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5 [&_code]:bg-fd-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[13px] [&_pre]:bg-fd-muted [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:text-[13px] [&_strong]:text-fd-foreground [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(simpleMarkdown(m.text), SANITIZE_CFG) }}
              />
            )}
          </div>
        ))}
        {loading && (
          <div className="py-1">
            <svg width="40" height="16" viewBox="0 0 40 16">
              <circle cx="8" cy="8" r="3" fill="hsl(var(--fd-primary))">
                <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" begin="0s" />
              </circle>
              <circle cx="20" cy="8" r="3" fill="hsl(var(--fd-primary))">
                <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
              </circle>
              <circle cx="32" cy="8" r="3" fill="hsl(var(--fd-primary))">
                <animate attributeName="opacity" values="1;0.3;1" dur="0.8s" repeatCount="indefinite" begin="0.4s" />
              </circle>
            </svg>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>
      {viewingConv ? (
        <div className="flex items-center justify-center px-4 py-3 border-t border-fd-border/30 text-[12px] text-fd-muted-foreground/40">
          Viewing saved conversation. Click "Continue (branch)" to ask more.
        </div>
      ) : (
        <div className="flex items-stretch border-t border-fd-border/30">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask about the video..."
            disabled={loading}
            className="flex-1 px-4 py-3 text-[14px] bg-transparent text-fd-foreground placeholder:text-fd-muted-foreground/30 focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="px-4 py-3 text-fd-primary text-[13px] font-medium hover:opacity-80 disabled:opacity-20 transition-opacity"
          >
            Send
          </button>
        </div>
      )}
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
        active ? "opacity-100" : "opacity-50"
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
        <span className="text-[11px] uppercase tracking-[0.06em] text-fd-muted-foreground/60">
          {step.tag}
        </span>
        <span className="ml-auto text-[11px] text-fd-muted-foreground/40 font-mono tabular-nums">
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

export default function TutorialViewer({ tutorial, _dbg, onBack, onRegenerate, isRegenerating, regenerateError, versions, onSelectVersion, currentVersion, pendingVersion, onDismissPending }: Props) {
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
    document.title = `${tutorial.title} — Video Breakdown | testy.cool`;

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
            description: `${tutorial.steps.length}-chapter video breakdown`,
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
        const firstStep = tutorial.steps[0];
        if (firstStep) {
          playerRef.current.seekTo(firstStep.startSeconds, true);
        }
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
      const nextStep = tutorial.steps[closestIdx];
      if (!nextStep) return;
      playerRef.current.seekTo(
        nextStep.startSeconds,
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
            <div className="shrink-0">
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes vtg-slide { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }
              `}} />
              <div className="flex items-center gap-2.5 px-5 lg:px-8 py-3 text-[13px] text-fd-foreground/80">
                <span className="h-3.5 w-3.5 rounded-full border-[1.5px] border-fd-primary border-t-transparent animate-spin shrink-0" />
                Regenerating with Gemini - you'll be switched automatically when ready
              </div>
              <div className="h-[2px] w-full bg-fd-border/30 overflow-hidden">
                <div
                  className="h-full bg-fd-primary rounded-full"
                  style={{ width: "40%", animation: "vtg-slide 1.4s ease-in-out infinite" }}
                />
              </div>
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
              {_dbg && (
                <div className="text-[11px] font-mono text-green-400/80 hidden xl:flex items-center gap-3">
                  <span>mode {tutorial.analysisMode || "auto"}</span>
                  <span>model {tutorial.analysisModel || "unknown"}</span>
                  <span>cost {formatUsd(tutorial.analysisCostUsd)}</span>
                </div>
              )}
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
            {tutorial.category && (
              <span className="inline-block text-[11px] font-medium uppercase tracking-[0.1em] text-fd-primary/70 bg-fd-primary/10 px-2 py-0.5 rounded-md mb-2">
                {tutorial.category}
              </span>
            )}
            <h1 className="text-xl lg:text-2xl font-extrabold text-fd-foreground mb-1.5 tracking-tight leading-snug">
              {tutorial.title}
            </h1>
            {tutorial.summary && (
              <div className="mb-6 pl-4 border-l-2 border-fd-border/40">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fd-muted-foreground/40 mb-1.5 block">
                  tl;dr
                </span>
                <div
                  className="text-base text-fd-foreground/70 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tutorial.summary.replace(/\n/g, "<br>"), SANITIZE_CFG) }}
                />
              </div>
            )}
            {(tutorial.channelIncentive || tutorial.hypeLevel || tutorial.trustLevel || tutorial.evidenceLevel || tutorial.whoShouldCare || tutorial.whatToDoAboutIt) && (
              <div className="mb-6">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fd-muted-foreground/40 mb-2 block">
                  Read This First
                </span>
                <div className="grid gap-2 sm:grid-cols-2">
                  <SignalBadge
                    label="Hype"
                    value={tutorial.hypeLevel}
                    tone={tutorial.hypeLevel === "high" ? "warn" : tutorial.hypeLevel === "low" ? "good" : "neutral"}
                  />
                  <SignalBadge
                    label="Trust"
                    value={tutorial.trustLevel}
                    tone={tutorial.trustLevel === "high" ? "good" : tutorial.trustLevel === "low" ? "bad" : "warn"}
                  />
                  <SignalBadge
                    label="Evidence"
                    value={tutorial.evidenceLevel}
                    tone={tutorial.evidenceLevel === "high" ? "good" : tutorial.evidenceLevel === "low" ? "bad" : "warn"}
                  />
                </div>
                {tutorial.channelIncentive && (
                  <div className="mt-3 p-4 rounded-xl border border-fd-border/50 bg-fd-card">
                    <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-fd-muted-foreground/40 mb-1.5">
                      Channel Incentive
                    </div>
                    <div className="text-[14px] leading-relaxed text-fd-foreground/75 whitespace-pre-wrap">
                      {tutorial.channelIncentive}
                    </div>
                  </div>
                )}
                {tutorial.whoShouldCare && (
                  <div className="mt-3 p-4 rounded-xl border border-fd-border/50 bg-fd-card">
                    <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-fd-muted-foreground/40 mb-1.5">
                      Who Should Care
                    </div>
                    <div className="text-[14px] leading-relaxed text-fd-foreground/75 whitespace-pre-wrap">
                      {tutorial.whoShouldCare}
                    </div>
                  </div>
                )}
                {tutorial.whatToDoAboutIt && (
                  <div className="mt-3 p-4 rounded-xl border border-fd-border/50 bg-fd-card">
                    <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-fd-muted-foreground/40 mb-1.5">
                      What To Do About It
                    </div>
                    <div className="text-[14px] leading-relaxed text-fd-foreground/75 whitespace-pre-wrap">
                      {tutorial.whatToDoAboutIt}
                    </div>
                  </div>
                )}
              </div>
            )}
            {tutorial.incentiveAnalysis && (
              <div className="mb-6 pl-4 border-l-2 border-fd-primary/40">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-fd-primary/70 mb-1.5 block">
                  Incentive
                </span>
                <div
                  className="text-base text-fd-foreground/70 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(tutorial.incentiveAnalysis.replace(/\n/g, "<br>"), SANITIZE_CFG) }}
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

            {/* Chat — _dbg only */}
            {_dbg && <ChatPanel videoId={tutorial.videoId} />}
          </div>
        </div>
      </div>
    </>
  );
}
