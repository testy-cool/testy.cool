"use client";

import type { VideoProgress } from '@/lib/tools/channel-pantry/types';
import VideoCard from './VideoCard';

interface Props {
  videos: VideoProgress[];
}

export default function VideoGrid({ videos }: Props) {
  if (videos.length === 0) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((v, i) => (
        <VideoCard key={v.videoId} video={v} index={i} />
      ))}
    </div>
  );
}
