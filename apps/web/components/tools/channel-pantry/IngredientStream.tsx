"use client";

import { useMemo } from 'react';
import type { IngredientFrequency, FoodCategory } from '@/lib/tools/channel-pantry/types';
import { FOOD_CATEGORIES } from '@/lib/tools/channel-pantry/types';

interface Props {
  ingredients: IngredientFrequency[];
  videosAnalyzed: number;
  isLoading: boolean;
  isComplete: boolean;
  onCopyList: () => void;
  onReset: () => void;
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

function summarizeQuantities(quantities?: string[]): string | null {
  if (!quantities || quantities.length === 0) return null;
  // Count frequency of each quantity
  const freq = new Map<string, number>();
  for (const q of quantities) {
    const normalized = q.toLowerCase().trim();
    if (normalized && normalized !== 'null') {
      freq.set(normalized, (freq.get(normalized) || 0) + 1);
    }
  }
  if (freq.size === 0) return null;
  // Return most common quantity
  const sorted = Array.from(freq.entries()).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  return top ? top[0] : null;
}

export default function IngredientStream({
  ingredients, videosAnalyzed, isLoading, isComplete, onCopyList, onReset,
}: Props) {
  const grouped = useMemo(() => {
    const map = new Map<FoodCategory, IngredientFrequency[]>();
    for (const ing of ingredients) {
      const list = map.get(ing.category) || [];
      list.push(ing);
      map.set(ing.category, list);
    }
    // Sort categories by total count
    return FOOD_CATEGORIES
      .filter(cat => map.has(cat.name))
      .map(cat => ({ ...cat, items: map.get(cat.name)! }));
  }, [ingredients]);

  const maxCount = Math.max(...ingredients.map(i => i.count), 1);

  if (ingredients.length === 0 && !isLoading) return null;

  return (
    <div className="mt-12">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-8">
        <div className="flex items-baseline gap-3">
          {isComplete && (
            <span className="text-3xl font-bold text-fd-foreground tracking-tight">
              {ingredients.length}
            </span>
          )}
          <span className="text-fd-muted-foreground text-lg">
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

      {/* Category sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {grouped.map((cat, catIdx) => (
          <div
            key={cat.name}
            className="animate-fade-slide-in"
            style={{ animationDelay: `${catIdx * 60}ms` }}
          >
            {/* Category header */}
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-xl">{cat.emoji}</span>
              <h3 className="text-[15px] font-semibold text-fd-foreground uppercase tracking-wide">
                {cat.name}
              </h3>
              <span className="text-xs text-fd-muted-foreground">
                {cat.items.length}
              </span>
            </div>

            {/* Ingredient rows */}
            <div className="space-y-2">
              {cat.items.map((ing, i) => {
                const pct = (ing.count / maxCount) * 100;
                const qty = summarizeQuantities(ing.quantities);
                return (
                  <div
                    key={ing.name}
                    className="group flex items-center gap-3 animate-fade-slide-in"
                    style={{ animationDelay: `${catIdx * 60 + i * 30}ms` }}
                  >
                    {/* Name + quantity */}
                    <div className="flex-1 min-w-0">
                      <span className="text-[15px] text-fd-foreground">
                        {ing.name}
                      </span>
                      {qty && (
                        <span className="ml-2 text-[13px] text-fd-muted-foreground">
                          · {qty}
                        </span>
                      )}
                    </div>

                    {/* Frequency bar */}
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="w-20 h-1.5 bg-fd-muted/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${CATEGORY_ACCENT[ing.category] || 'bg-gray-400'} transition-all duration-500 ease-out`}
                          style={{ width: `${pct}%`, opacity: 0.7 }}
                        />
                      </div>
                      <span className="text-[13px] text-fd-muted-foreground tabular-nums min-w-[36px] text-right">
                        {ing.count}/{videosAnalyzed}
                      </span>
                    </div>
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
