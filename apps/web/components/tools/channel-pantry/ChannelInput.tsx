"use client";

import { useState } from 'react';

interface GlobalChannel {
  channelId: string;
  channelTitle: string;
  videoCount: number;
  ingredientCount: number;
  timestamp: number;
}

interface Props {
  onSubmit: (channelInput: string, videoCount: number) => void;
  isLoading: boolean;
  globalChannels: GlobalChannel[];
  onLoadGlobal: (channel: GlobalChannel) => void;
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function ChannelInput({ onSubmit, isLoading, globalChannels, onLoadGlobal }: Props) {
  const [input, setInput] = useState('');
  const [videoCount, setVideoCount] = useState(20);

  const handleSubmit = () => {
    if (input.trim() && !isLoading) onSubmit(input, videoCount);
  };

  return (
    <div>
      {/* Search bar */}
      <div className="flex items-stretch rounded-xl border border-fd-border bg-fd-card shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-fd-primary focus-within:border-transparent transition-shadow">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder="@handle, channel URL, or any video URL"
          disabled={isLoading}
          className="flex-1 px-5 py-3.5 text-[16px] bg-transparent text-fd-foreground placeholder:text-fd-muted-foreground/60 focus:outline-none disabled:opacity-50 min-w-0"
        />
        <select
          value={videoCount}
          onChange={e => setVideoCount(Number(e.target.value))}
          disabled={isLoading}
          className="px-2 py-3.5 text-[14px] bg-transparent text-fd-muted-foreground border-l border-fd-border focus:outline-none disabled:opacity-50 cursor-pointer"
        >
          {[10, 20, 30, 50].map(n => (
            <option key={n} value={n}>{n} videos</option>
          ))}
        </select>
        <button
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
          className="px-6 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-[15px] font-semibold hover:bg-zinc-700 dark:hover:bg-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Analyzing
            </span>
          ) : (
            'Analyze'
          )}
        </button>
      </div>

      {/* Global recent channels */}
      {globalChannels.length > 0 && !isLoading && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-fd-muted-foreground/60">Recently analyzed:</span>
          {globalChannels.map(c => (
            <button
              key={c.channelId}
              onClick={() => onLoadGlobal(c)}
              className="px-3 py-1 text-[13px] text-fd-muted-foreground rounded-full border border-fd-border/60 hover:border-fd-primary/40 hover:text-fd-foreground transition-colors"
              title={`${c.ingredientCount} ingredients from ${c.videoCount} videos · ${timeAgo(c.timestamp)}`}
            >
              {c.channelTitle}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
