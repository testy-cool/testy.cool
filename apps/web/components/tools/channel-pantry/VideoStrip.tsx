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
    <div className="mt-10 md:mt-14">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors mb-4 group"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
        <span>
          {isLoading ? `${doneCount}/${videos.length} videos scanned` : `${videos.length} videos analyzed`}
        </span>
        {isLoading && (
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-fd-primary animate-pulse" />
        )}
      </button>

      {/* Compact thumbnail row — always visible */}
      {!expanded && (
        <div className="flex gap-1 overflow-x-auto pb-2 -mx-1 px-1">
          {videos.map((video) => {
            const processing = isProcessing(video.status);
            const done = video.status === 'done';
            const skipped = video.status === 'skipped';
            const pending = video.status === 'pending';

            return (
              <a
                key={video.videoId}
                href={`https://www.youtube.com/watch?v=${video.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative shrink-0 rounded-md overflow-hidden group/thumb"
                style={{ width: 80, height: 45 }}
                title={video.title}
              >
                <img
                  src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                  alt=""
                  className={`w-full h-full object-cover transition-opacity duration-300 group-hover/thumb:opacity-80 ${pending ? 'opacity-30' : ''}`}
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  {processing && (
                    <span className="h-3.5 w-3.5 rounded-full border-2 border-white/80 border-t-transparent animate-spin" />
                  )}
                  {done && (
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-green-500/80 text-white text-[8px]">✓</span>
                  )}
                  {skipped && (
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gray-500/70 text-white text-[8px]">–</span>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Expanded list with titles, ingredient counts, and links */}
      {expanded && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 animate-fade-slide-in">
          {videos.map((video) => (
            <a
              key={video.videoId}
              href={`https://www.youtube.com/watch?v=${video.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-fd-muted/20 transition-colors group/vid"
            >
              <img
                src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                alt=""
                className="w-20 h-11 rounded-md object-cover shrink-0"
                loading="lazy"
              />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-fd-foreground leading-tight line-clamp-2 group-hover/vid:underline">
                  {video.title}
                </p>
                <p className="text-[11px] text-fd-muted-foreground mt-0.5">
                  {video.status === 'done' && `${video.ingredients.length} ingredients`}
                  {video.status === 'skipped' && 'no ingredients found'}
                  {isProcessing(video.status) && 'scanning...'}
                  {video.status === 'pending' && 'waiting'}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
