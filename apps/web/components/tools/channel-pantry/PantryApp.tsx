"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { ChannelAnalysisResult, VideoProgress, CostAccumulator, IngredientFrequency } from '@/lib/tools/channel-pantry/types';
import { parseChannelInput, getChannelInfo, getRecentVideos, getChannelFromVideo } from '@/lib/tools/channel-pantry/youtubeService';
import { analyzeChannel } from '@/lib/tools/channel-pantry/channelAnalyzerService';
import ChannelInput from './ChannelInput';
import VideoGrid from './VideoGrid';
import LiveSummary from './LiveSummary';

const CACHE_KEY = 'pantry_cache';

function loadCache(): ChannelAnalysisResult[] {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]');
  } catch { return []; }
}

function saveCache(results: ChannelAnalysisResult[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(results.slice(0, 10)));
  } catch {}
}

export default function PantryApp() {
  const [result, setResult] = useState<ChannelAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoProgress, setVideoProgress] = useState<VideoProgress[]>([]);
  const [cost, setCost] = useState<CostAccumulator>({ promptTokens: 0, outputTokens: 0, totalCost: 0 });
  const [cachedChannels, setCachedChannels] = useState<ChannelAnalysisResult[]>([]);
  const startTimeRef = useRef(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timerRef = useRef<number>(0);

  // SSR-safe: load cache after mount
  useEffect(() => { setCachedChannels(loadCache()); }, []);

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

  const liveIngredients = useMemo((): IngredientFrequency[] => {
    const freq = new Map<string, IngredientFrequency>();
    for (const vp of videoProgress) {
      for (const ing of vp.ingredients) {
        const key = ing.name.toLowerCase();
        const existing = freq.get(key);
        if (existing) {
          existing.count++;
          if (!existing.videoIds.includes(vp.videoId)) {
            existing.videoIds.push(vp.videoId);
          }
        } else {
          freq.set(key, {
            name: ing.name,
            category: ing.category,
            count: 1,
            videoIds: [vp.videoId],
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
      setCachedChannels(prev => {
        const updated = [analysisResult, ...prev.filter(c => c.channelId !== channelId)];
        saveCache(updated);
        return updated;
      });
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleLoadCached = useCallback((cached: ChannelAnalysisResult) => {
    setResult(cached);
    setError(null);
    setVideoProgress([]);
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
    const text = ings.map(i => `${i.name} (${i.count}/${count})`).join('\n');
    navigator.clipboard.writeText(text);
  }, [result, liveIngredients, videoProgress.length]);

  const showGrid = videoProgress.length > 0 || result;

  return (
    <div className="max-w-5xl mx-auto">
      <ChannelInput
        onSubmit={handleSubmit}
        isLoading={isLoading}
        cachedChannels={cachedChannels}
        onLoadCached={handleLoadCached}
      />

      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {error}
          <button onClick={handleReset} className="ml-3 underline">Try again</button>
        </div>
      )}

      {isLoading && videoProgress.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-fd-foreground">{doneCount}/{videoProgress.length} videos</span>
            <span className="text-sm text-fd-muted-foreground">
              ${cost.totalCost.toFixed(4)} · {Math.round(elapsedMs / 1000)}s
            </span>
          </div>
          <div className="w-full h-1 bg-fd-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-fd-primary rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      {showGrid && (
        <div className="mt-8">
          <VideoGrid videos={videoProgress} />
        </div>
      )}

      {(displayIngredients.length > 0 || isLoading) && (
        <div className="mt-8">
          <LiveSummary
            ingredients={displayIngredients}
            videosAnalyzed={videosAnalyzed}
            isLoading={isLoading}
            onCopyList={handleCopyList}
            onReset={handleReset}
          />
        </div>
      )}
    </div>
  );
}
