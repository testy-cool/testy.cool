"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { ChannelAnalysisResult, VideoProgress, CostAccumulator, IngredientFrequency } from '@/lib/tools/channel-pantry/types';
import { parseChannelInput, getChannelInfo, getRecentVideos, getChannelFromVideo } from '@/lib/tools/channel-pantry/youtubeService';
import { analyzeChannel } from '@/lib/tools/channel-pantry/channelAnalyzerService';
import ChannelInput from './ChannelInput';
import IngredientStream from './IngredientStream';
import VideoStrip from './VideoStrip';

interface GlobalChannel {
  channelId: string;
  channelTitle: string;
  videoCount: number;
  ingredientCount: number;
  timestamp: number;
}

/** Fetch recently analyzed channels from global KV */
async function fetchGlobalRecent(): Promise<GlobalChannel[]> {
  try {
    const res = await fetch('/api/pantry/channels?action=recent');
    if (!res.ok) return [];
    const data = await res.json();
    return data.channels || [];
  } catch { return []; }
}

/** Fetch a cached analysis result from global KV */
async function fetchGlobalResult(channelId: string): Promise<ChannelAnalysisResult | null> {
  try {
    const res = await fetch(`/api/pantry/channels?channelId=${encodeURIComponent(channelId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.result || null;
  } catch { return null; }
}

/** Save analysis result to global KV */
async function saveGlobalResult(result: ChannelAnalysisResult): Promise<void> {
  try {
    await fetch('/api/pantry/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channelId: result.channelId, result }),
    });
  } catch {}
}

export default function PantryApp() {
  const [result, setResult] = useState<ChannelAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const [cost, setCost] = useState<CostAccumulator>({ promptTokens: 0, outputTokens: 0, totalCost: 0 });
  const [globalChannels, setGlobalChannels] = useState<GlobalChannel[]>([]);
  const startTimeRef = useRef<number>(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<number>(0);

  // Fetch global recent channels on mount
  useEffect(() => {
    fetchGlobalRecent().then(setGlobalChannels);
  }, []);

  useEffect(() => {
    if (isLoading) {
      startTimeRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsedMs(Date.now() - startTimeRef.current);
      }, 200);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isLoading]);

  // Live ingredient aggregation from video progress
  const liveIngredients = useMemo((): IngredientFrequency[] => {
    const freq = new Map<string, IngredientFrequency>();
    for (const vp of videoProgress) {
      const seen = new Set<string>();
      for (const ing of vp.ingredients) {
        const key = ing.name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);

        const existing = freq.get(key);
        if (existing) {
          if (!existing.videoIds.includes(vp.videoId)) {
            existing.count++;
            existing.videoIds.push(vp.videoId);
          }
          if (ing.quantity) {
            existing.videoQuantities = { ...existing.videoQuantities, [vp.videoId]: ing.quantity };
          }
        } else {
          freq.set(key, {
            name: ing.name,
            category: ing.category,
            count: 1,
            videoIds: [vp.videoId],
            videoQuantities: ing.quantity ? { [vp.videoId]: ing.quantity } : {},
          });
        }
      }
    }
    return Array.from(freq.values()).sort((a, b) => b.count - a.count);
  }, [videoProgress]);

  const displayIngredients = result ? result.ingredients : liveIngredients;
  const videosAnalyzed = result ? result.videosAnalyzed : videoProgress.length;
  const doneCount = videoProgress.filter(v => v.status === 'done' || v.status === 'skipped').length;
  const progressPct = videoProgress.length > 0 ? Math.round((doneCount / videoProgress.length) * 100) : 0;
  const isComplete = !!result;

  const handleSubmit = useCallback(async (channelInput: string, videoCount: number) => {
    setResult(null);
    setError(null);
    setVideoProgress([]);
    setCost({ promptTokens: 0, outputTokens: 0, totalCost: 0 });
    setIsLoading(true);
    setElapsedMs(0);

    try {
      const parsed = parseChannelInput(channelInput);
      const channelHandle = parsed.type === 'channel' ? parsed.value : await getChannelFromVideo(parsed.videoId);
      const { channelId, channelTitle, uploadsPlaylistId } = await getChannelInfo(channelHandle);
      const videos = await getRecentVideos(uploadsPlaylistId, videoCount);

      if (videos.length === 0) throw new Error('No videos found on this channel');

      const onProgress = (progress: VideoProgress) => {
        setVideoProgress(prev => {
          const idx = prev.findIndex(p => p.videoId === progress.videoId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = progress;
            return next;
          }
          return [...prev, progress];
        });
      };

      const { ingredients, cost: finalCost, videosWithIngredients } = await analyzeChannel(
        videos, onProgress, (c) => setCost(c)
      );

      if (ingredients.length === 0 || videosWithIngredients < 3) {
        throw new Error("This doesn't look like a cooking channel - fewer than 3 videos had ingredients.");
      }

      const analysisResult: ChannelAnalysisResult = {
        channelId,
        channelTitle,
        videoCount: videos.length,
        videosAnalyzed: videos.length,
        videosWithIngredients,
        ingredients,
        totalCost: finalCost.totalCost,
        elapsedMs: Date.now() - startTimeRef.current,
        timestamp: Date.now(),
      };

      setResult(analysisResult);

      // Save to global KV + refresh recent list
      saveGlobalResult(analysisResult).then(() => {
        fetchGlobalRecent().then(setGlobalChannels);
      });
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadGlobal = useCallback(async (channel: GlobalChannel) => {
    setError(null);
    setVideoProgress([]);
    setIsLoading(true);

    try {
      const cached = await fetchGlobalResult(channel.channelId);
      if (cached) {
        setResult(cached);
      } else {
        setError('Cached result expired. Try analyzing again.');
      }
    } catch {
      setError('Failed to load cached result.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
    setVideoProgress([]);
    setCost({ promptTokens: 0, outputTokens: 0, totalCost: 0 });
  }, []);

  const handleCopyList = useCallback(() => {
    const ings = result ? result.ingredients : liveIngredients;
    const count = result ? result.videosAnalyzed : videoProgress.length;
    const text = ings.map(i => {
      const qtys = Object.values(i.videoQuantities || {});
      const qty = qtys.length > 0 ? ` (${qtys[0]})` : '';
      return `${i.name}${qty} — ${i.count}/${count} videos`;
    }).join('\n');
    navigator.clipboard.writeText(text);
  }, [result, liveIngredients, videoProgress.length]);

  const showResults = videoProgress.length > 0 || result;

  return (
    <>
      {/* Input */}
      <ChannelInput
        onSubmit={handleSubmit}
        isLoading={isLoading}
        globalChannels={globalChannels}
        onLoadGlobal={handleLoadGlobal}
      />

      {/* Error */}
      {error && (
        <div className="mt-8 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm">
          {error}
          <button onClick={handleReset} className="ml-3 underline hover:no-underline">Try again</button>
        </div>
      )}

      {/* Progress strip */}
      {isLoading && videoProgress.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-fd-muted-foreground">
              {doneCount}/{videoProgress.length} videos
            </span>
            <span className="text-[13px] text-fd-muted-foreground tabular-nums">
              ${cost.totalCost.toFixed(4)} · {Math.round(elapsedMs / 1000)}s
            </span>
          </div>
          <div className="w-full h-0.5 bg-fd-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-fd-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Ingredients — the hero */}
      {showResults && (
        <IngredientStream
          ingredients={displayIngredients}
          videosAnalyzed={videosAnalyzed}
          isLoading={isLoading}
          isComplete={isComplete}
          onCopyList={handleCopyList}
          onReset={handleReset}
          videoProgress={videoProgress}
        />
      )}

      {/* Videos — secondary */}
      {showResults && (
        <VideoStrip
          videos={videoProgress}
          isLoading={isLoading}
        />
      )}
    </>
  );
}
