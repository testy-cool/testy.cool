"use client";

import type { VideoProgress, FoodCategory } from '@/lib/tools/channel-pantry/types';

interface Props {
  video: VideoProgress;
  index: number;
}

const CATEGORY_COLORS: Record<FoodCategory, string> = {
  'Proteins': 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  'Dairy & Eggs': 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  'Vegetables': 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
  'Fruits': 'bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300',
  'Grains & Starches': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  'Spices & Seasonings': 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  'Oils & Fats': 'bg-lime-100 text-lime-700 dark:bg-lime-950 dark:text-lime-300',
  'Sauces & Condiments': 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  'Other': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

function relativeDate(iso?: string): string {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return '1d ago';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

const isProcessing = (s: string) =>
  s === 'extracting_description' || s === 'fetching_transcript' || s === 'extracting_transcript';

export default function VideoCard({ video, index }: Props) {
  const processing = isProcessing(video.status);
  const done = video.status === 'done';
  const skipped = video.status === 'skipped';

  return (
    <div
      className="bg-fd-card border border-fd-border rounded-xl overflow-hidden animate-fade-slide-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="relative aspect-video bg-fd-muted">
        <img
          src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute top-2 right-2">
          {processing && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/90 shadow-sm">
              <span className="h-3 w-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </span>
          )}
          {done && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white shadow-sm text-xs">
              ✓
            </span>
          )}
          {skipped && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-300 text-white shadow-sm text-xs">
              –
            </span>
          )}
        </div>
      </div>

      <div className="p-3">
        <h3 className="text-[13px] font-medium text-fd-foreground leading-snug line-clamp-2 min-h-[2.5em]">
          {video.title}
        </h3>
        {video.publishedAt && (
          <p className="text-[11px] text-fd-muted-foreground mt-1">{relativeDate(video.publishedAt)}</p>
        )}

        <div className="mt-2 flex flex-wrap gap-1 min-h-[28px]">
          {processing && (
            <>
              <span className="shimmer-bg animate-shimmer h-5 w-14 rounded-full" />
              <span className="shimmer-bg animate-shimmer h-5 w-10 rounded-full" />
              <span className="shimmer-bg animate-shimmer h-5 w-16 rounded-full" />
            </>
          )}
          {(done || skipped) && video.ingredients.map((ing, i) => (
            <span
              key={ing.name}
              className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded-full animate-tag-pop ${CATEGORY_COLORS[ing.category] || CATEGORY_COLORS.Other}`}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {ing.name}
            </span>
          ))}
          {skipped && video.ingredients.length === 0 && (
            <span className="text-[11px] text-fd-muted-foreground italic">no ingredients found</span>
          )}
        </div>
      </div>
    </div>
  );
}
