"use client";

import { useState } from 'react';
import type { VideoProgress } from '@/lib/tools/channel-pantry/types';

interface Props {
  videos: VideoProgress[];
  isLoading: boolean;
}

const isProcessing = (s: string) =>
  s === 'extracting_description' || s === 'fetching_transcript' || s === 'extracting_transcript';

export default function VideoStrip({ videos, isLoading }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (videos.length === 0) return null;

  const doneCount = videos.filter(v => v.status === 'done' || v.status === 'skipped').length;

  return (
    <div className="mt-12">
      {/* Header — clickable to expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors mb-3 group"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span>
          {isLoading ? `${doneCount}/${videos.length} videos scanned` : `${videos.length} videos`}
        </span>
        {isLoading && (
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-fd-primary animate-pulse" />
        )}
      </button>

      {/* Thumbnail strip — always visible */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
        {videos.map((video) => {
          const processing = isProcessing(video.status);
          const done = video.status === 'done';
          const skipped = video.status === 'skipped';
          const pending = video.status === 'pending';

          return (
            <div
              key={video.videoId}
              className="relative shrink-0 rounded-lg overflow-hidden group/thumb"
              style={{ width: 96, height: 54 }}
              title={video.title}
            >
              <img
                src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                alt=""
                className={`w-full h-full object-cover transition-opacity duration-300 ${pending ? 'opacity-40' : 'opacity-100'}`}
                loading="lazy"
              />
              {/* Status overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                {processing && (
                  <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                {done && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500/90 text-white text-[9px]">
                    ✓
                  </span>
                )}
                {skipped && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-500/80 text-white text-[9px]">
                    –
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expanded detail list */}
      {expanded && (
        <div className="mt-3 space-y-2 animate-fade-slide-in">
          {videos.map((video) => (
            <div
              key={video.videoId}
              className="flex items-center gap-3 py-1.5"
            >
              <img
                src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                alt=""
                className="w-16 h-9 rounded object-cover shrink-0"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-fd-foreground truncate">{video.title}</p>
                <p className="text-[11px] text-fd-muted-foreground">
                  {video.status === 'done' && `${video.ingredients.length} ingredients`}
                  {video.status === 'skipped' && 'skipped'}
                  {isProcessing(video.status) && 'scanning...'}
                  {video.status === 'pending' && 'waiting'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
