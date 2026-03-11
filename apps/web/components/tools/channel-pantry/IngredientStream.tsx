"use client";

import { useMemo, useState, useRef, useEffect } from 'react';
import type { IngredientFrequency, FoodCategory, VideoProgress } from '@/lib/tools/channel-pantry/types';
import { FOOD_CATEGORIES } from '@/lib/tools/channel-pantry/types';

interface Props {
  ingredients: IngredientFrequency[];
  videosAnalyzed: number;
  isLoading: boolean;
  isComplete: boolean;
  onCopyList: () => void;
  onReset: () => void;
  videoProgress: VideoProgress[];
}

const CATEGORY_ACCENT: Record<FoodCategory, string> = {
  'Proteins': 'bg-red-500',
  'Dairy & Eggs': 'bg-amber-500',
  'Vegetables': 'bg-emerald-500',
  'Fruits': 'bg-pink-500',
  'Grains & Starches': 'bg-yellow-500',
  'Spices & Seasonings': 'bg-orange-500',
  'Oils & Fats': 'bg-lime-500',
  'Sauces & Condiments': 'bg-purple-500',
  'Other': 'bg-gray-400',
};

function typicalQuantity(videoQuantities?: Record<string, string>): string | null {
  if (!videoQuantities) return null;
  const vals = Object.values(videoQuantities).filter(v => v && v !== 'null');
  if (vals.length === 0) return null;
  // Most common quantity
  const freq = new Map<string, number>();
  for (const v of vals) {
    const n = v.toLowerCase().trim();
    freq.set(n, (freq.get(n) || 0) + 1);
  }
  const top = Array.from(freq.entries()).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}

/** Hover popover for an ingredient showing per-video details */
function IngredientPopover({
  ing,
  videoProgress,
  onClose,
}: {
  ing: IngredientFrequency;
  videoProgress: VideoProgress[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const videoMap = useMemo(() => {
    const map = new Map<string, VideoProgress>();
    for (const vp of videoProgress) map.set(vp.videoId, vp);
    return map;
  }, [videoProgress]);

  return (
    <div
      ref={ref}
      className="absolute left-0 top-full mt-1 z-50 w-80 max-h-64 overflow-y-auto rounded-xl border border-fd-border bg-fd-card shadow-lg animate-fade-slide-in"
      style={{ animationDuration: '150ms' }}
    >
      <div className="p-3">
        <div className="text-[13px] font-semibold text-fd-foreground mb-2">
          {ing.name} — {ing.videoIds.length} video{ing.videoIds.length !== 1 ? 's' : ''}
        </div>
        <div className="space-y-1.5">
          {ing.videoIds.map(vid => {
            const vp = videoMap.get(vid);
            const qty = ing.videoQuantities?.[vid];
            return (
              <a
                key={vid}
                href={`https://www.youtube.com/watch?v=${vid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 group/row hover:bg-fd-muted/30 rounded-lg p-1.5 -mx-1.5 transition-colors"
              >
                <img
                  src={`https://i.ytimg.com/vi/${vid}/mqdefault.jpg`}
                  alt=""
                  className="w-14 h-8 rounded object-cover shrink-0"
                  loading="lazy"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-fd-foreground leading-tight line-clamp-2 group-hover/row:underline">
                    {vp?.title || vid}
                  </p>
                  {qty && qty !== 'null' && (
                    <p className="text-[11px] text-fd-muted-foreground mt-0.5">{qty}</p>
                  )}
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function IngredientStream({
  ingredients, videosAnalyzed, isLoading, isComplete, onCopyList, onReset, videoProgress,
}: Props) {
  const [hoveredIng, setHoveredIng] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<FoodCategory, IngredientFrequency[]>();
    for (const ing of ingredients) {
      const list = map.get(ing.category) || [];
      list.push(ing);
      map.set(ing.category, list);
    }
    return FOOD_CATEGORIES
      .filter(cat => map.has(cat.name))
      .map(cat => ({ ...cat, items: map.get(cat.name)! }));
  }, [ingredients]);

  const maxCount = Math.max(...ingredients.map(i => i.count), 1);

  if (ingredients.length === 0 && !isLoading) return null;

  return (
    <div className="mt-10 md:mt-14">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-6 md:mb-8">
        <div className="flex items-baseline gap-3">
          {isComplete && (
            <span className="text-2xl md:text-3xl font-bold text-fd-foreground tracking-tight">
              {ingredients.length}
            </span>
          )}
          <span className="text-fd-muted-foreground text-base md:text-lg">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-fd-primary animate-pulse" />
                Scanning videos...
              </span>
            ) : (
              `ingredients across ${videosAnalyzed} videos`
            )}
          </span>
        </div>
        {isComplete && (
          <div className="flex gap-3">
            <button
              onClick={onCopyList}
              className="text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            >
              Copy list
            </button>
            <button
              onClick={onReset}
              className="text-sm text-fd-muted-foreground hover:text-fd-foreground transition-colors"
            >
              New analysis
            </button>
          </div>
        )}
      </div>

      {/* Category sections — responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {grouped.map((cat, catIdx) => (
          <div
            key={cat.name}
            className="animate-fade-slide-in"
            style={{ animationDelay: `${catIdx * 60}ms` }}
          >
            {/* Category header */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{cat.emoji}</span>
              <h3 className="text-[14px] font-semibold text-fd-foreground uppercase tracking-wide">
                {cat.name}
              </h3>
              <span className="text-[12px] text-fd-muted-foreground/60">
                {cat.items.length}
              </span>
            </div>

            {/* Ingredient rows */}
            <div className="space-y-1">
              {cat.items.map((ing, i) => {
                const pct = (ing.count / maxCount) * 100;
                const qty = typicalQuantity(ing.videoQuantities);
                const isOpen = hoveredIng === `${cat.name}:${ing.name}`;
                const popoverKey = `${cat.name}:${ing.name}`;

                return (
                  <div
                    key={ing.name}
                    className="relative animate-fade-slide-in"
                    style={{ animationDelay: `${catIdx * 60 + i * 25}ms` }}
                  >
                    <button
                      onClick={() => setHoveredIng(isOpen ? null : popoverKey)}
                      className="w-full flex items-center gap-2 py-1 rounded-lg hover:bg-fd-muted/20 transition-colors text-left cursor-pointer px-1 -mx-1"
                    >
                      {/* Name + quantity */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[14px] text-fd-foreground">
                          {ing.name}
                        </span>
                        {qty && (
                          <span className="ml-1.5 text-[12px] text-fd-muted-foreground">
                            · {qty}
                          </span>
                        )}
                      </div>

                      {/* Frequency bar + count */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div className="w-12 md:w-16 h-1 bg-fd-muted/40 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${CATEGORY_ACCENT[ing.category] || 'bg-gray-400'} transition-all duration-500 ease-out`}
                            style={{ width: `${pct}%`, opacity: 0.65 }}
                          />
                        </div>
                        <span className="text-[12px] text-fd-muted-foreground tabular-nums min-w-[28px] text-right">
                          {ing.count}/{videosAnalyzed}
                        </span>
                      </div>
                    </button>

                    {/* Popover with per-video details */}
                    {isOpen && (
                      <IngredientPopover
                        ing={ing}
                        videoProgress={videoProgress}
                        onClose={() => setHoveredIng(null)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
