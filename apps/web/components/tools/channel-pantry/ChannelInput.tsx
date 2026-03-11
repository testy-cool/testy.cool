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
  return `${days} days ago`;
}

export default function ChannelInput({ onSubmit, isLoading, cachedChannels, onLoadCached }: Props) {
  const [input, setInput] = useState('');
  const [videoCount, setVideoCount] = useState(20);

  return (
    <div>
      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <label className="block text-sm font-medium text-fd-foreground mb-1">Channel or video</label>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="@handle, channel URL, or any video URL"
            disabled={isLoading}
            className="w-full px-4 py-2.5 border border-fd-border rounded-lg text-[15px] bg-fd-card text-fd-foreground focus:outline-none focus:ring-2 focus:ring-fd-primary focus:border-transparent disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-fd-foreground mb-1">Videos</label>
          <select
            value={videoCount}
            onChange={e => setVideoCount(Number(e.target.value))}
            disabled={isLoading}
            className="px-3 py-2.5 border border-fd-border rounded-lg text-[15px] bg-fd-card text-fd-foreground focus:outline-none focus:ring-2 focus:ring-fd-primary disabled:opacity-50"
          >
            {[10, 20, 30, 50].map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => onSubmit(input, videoCount)}
          disabled={isLoading || !input.trim()}
          className="px-6 py-2.5 bg-fd-primary text-fd-primary-foreground rounded-lg text-[15px] font-semibold hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Analyze
        </button>
      </div>

      {cachedChannels.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-fd-muted-foreground uppercase tracking-wide mb-2">Recent</p>
          <div className="flex flex-wrap gap-2">
            {cachedChannels.map(c => (
              <button
                key={c.channelId}
                onClick={() => onLoadCached(c)}
                disabled={isLoading}
                className="px-3 py-1.5 text-sm text-fd-muted-foreground bg-fd-card border border-fd-border rounded-full hover:border-fd-primary/50 disabled:opacity-50"
              >
                {c.channelTitle} · {timeAgo(c.timestamp)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
