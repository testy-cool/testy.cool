"use client";

import { useState } from 'react';
import type { ChannelAnalysisResult } from '@/lib/tools/channel-pantry/types';

interface Props {
  onSubmit: (channelInput: string, videoCount: number) => void;
  isLoading: boolean;
  cachedChannels: ChannelAnalysisResult[];
  onLoadCached: (result: ChannelAnalysisResult) => void;
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export default function ChannelInput({ onSubmit, isLoading, cachedChannels, onLoadCached }: Props) {
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
          className="flex-1 px-5 py-3.5 text-[16px] bg-transparent text-fd-foreground placeholder:text-fd-muted-foreground/60 focus:outline-none disabled:opacity-50"
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
          className="px-6 py-3.5 bg-fd-primary text-fd-primary-foreground text-[15px] font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-3.5 rounded-full border-2 border-fd-primary-foreground border-t-transparent animate-spin" />
              Analyzing
            </span>
          ) : (
            'Analyze'
          )}
        </button>
      </div>

      {/* Recent channels */}
      {cachedChannels.length > 0 && !isLoading && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-fd-muted-foreground/60">Recent:</span>
          {cachedChannels.map(c => (
            <button
              key={c.channelId}
              onClick={() => onLoadCached(c)}
              className="px-3 py-1 text-[13px] text-fd-muted-foreground rounded-full border border-fd-border/60 hover:border-fd-primary/40 hover:text-fd-foreground transition-colors"
            >
              {c.channelTitle}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
