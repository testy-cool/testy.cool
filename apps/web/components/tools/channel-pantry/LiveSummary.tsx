"use client";

import type { IngredientFrequency } from '@/lib/tools/channel-pantry/types';
import { FOOD_CATEGORIES as CATEGORIES } from '@/lib/tools/channel-pantry/types';

interface Props {
  ingredients: IngredientFrequency[];
  videosAnalyzed: number;
  isLoading: boolean;
  onCopyList: () => void;
  onReset: () => void;
}

export default function LiveSummary({ ingredients, videosAnalyzed, isLoading, onCopyList, onReset }: Props) {
  if (ingredients.length === 0 && !isLoading) return null;

  const maxCount = Math.max(...ingredients.map(i => i.count), 1);

  const grouped = new Map<string, IngredientFrequency[]>();
  for (const ing of ingredients) {
    const list = grouped.get(ing.category) || [];
    list.push(ing);
    grouped.set(ing.category, list);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-fd-foreground tracking-tight">Pantry</h2>
          {isLoading && (
            <span className="flex items-center gap-1.5 text-sm text-fd-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
              Building...
            </span>
          )}
          {!isLoading && (
            <span className="text-sm text-fd-muted-foreground">{ingredients.length} ingredients</span>
          )}
        </div>
        {!isLoading && ingredients.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={onCopyList}
              className="px-3 py-1.5 text-xs bg-fd-card border border-fd-border rounded-lg text-fd-muted-foreground hover:border-fd-primary/50"
            >
              Copy list
            </button>
            <button
              onClick={onReset}
              className="px-3 py-1.5 text-xs bg-fd-card border border-fd-border rounded-lg text-fd-muted-foreground hover:border-fd-primary/50"
            >
              New analysis
            </button>
          </div>
        )}
      </div>

      {ingredients.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {CATEGORIES.filter(cat => grouped.has(cat.name)).map(cat => {
            const items = grouped.get(cat.name)!;
            return (
              <div key={cat.name} className="bg-fd-card border border-fd-border rounded-xl p-4 animate-fade-slide-in">
                <div className="text-[13px] font-semibold text-fd-muted-foreground uppercase tracking-wide mb-3">
                  {cat.emoji} {cat.name}
                </div>
                <div className="space-y-1.5">
                  {items.map(ing => {
                    const pct = (ing.count / maxCount) * 100;
                    const ratio = ing.count / Math.max(videosAnalyzed, 1);
                    const barColor = ratio > 0.5 ? 'bg-green-500' : ratio > 0.25 ? 'bg-green-400' : 'bg-green-300';
                    return (
                      <div key={ing.name} className="flex items-center justify-between gap-2">
                        <span className="text-[14px] text-fd-foreground">{ing.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="w-16 h-1.5 bg-fd-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barColor} transition-all duration-[600ms] ease-out`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[12px] text-fd-muted-foreground min-w-[32px] text-right">
                            {ing.count}/{videosAnalyzed}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
