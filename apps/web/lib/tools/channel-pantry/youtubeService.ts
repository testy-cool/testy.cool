import type { VideoInfo } from './types';

/** Parse input into either { type: 'channel', value } or { type: 'video', videoId } */
export function parseChannelInput(input: string): { type: 'channel'; value: string } | { type: 'video'; videoId: string } {
  const trimmed = input.trim();
  if (trimmed.startsWith('@')) return { type: 'channel', value: trimmed };
  try {
    const url = new URL(trimmed);
    const path = url.pathname;
    const vParam = url.searchParams.get('v');
    if (vParam) return { type: 'video', videoId: vParam };
    const shortsMatch = path.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch?.[1]) return { type: 'video', videoId: shortsMatch[1] };
    if (url.hostname === 'youtu.be') {
      const id = path.slice(1).split('/')[0];
      if (id && id.length === 11) return { type: 'video', videoId: id };
    }
    const handleMatch = path.match(/\/@([^/]+)/);
    if (handleMatch?.[1]) return { type: 'channel', value: '@' + handleMatch[1] };
    const channelMatch = path.match(/\/channel\/([^/]+)/);
    if (channelMatch?.[1]) return { type: 'channel', value: channelMatch[1] };
    const cMatch = path.match(/\/c\/([^/]+)/);
    if (cMatch?.[1]) return { type: 'channel', value: '@' + cMatch[1] };
  } catch {}
  if (/^UC[a-zA-Z0-9_-]{22}$/.test(trimmed)) return { type: 'channel', value: trimmed };
  if (/^[a-zA-Z0-9_.-]+$/.test(trimmed)) return { type: 'channel', value: '@' + trimmed };
  throw new Error('Could not parse channel or video from input: ' + trimmed);
}

/** Look up the channel that owns a video */
export async function getChannelFromVideo(videoId: string): Promise<string> {
  const res = await fetch(`/api/pantry/youtube?action=channelFromVideo&videoId=${encodeURIComponent(videoId)}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  if (!data.items?.length) throw new Error('Video not found');
  return data.items[0].snippet.channelId;
}

/** Resolve a handle or channel ID to channel info */
export async function getChannelInfo(handleOrId: string): Promise<{
  channelId: string;
  channelTitle: string;
  uploadsPlaylistId: string;
}> {
  const res = await fetch(`/api/pantry/youtube?action=channelInfo&handle=${encodeURIComponent(handleOrId)}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  if (!data.items?.length) throw new Error('Channel not found');

  const ch = data.items[0];
  return {
    channelId: ch.id,
    channelTitle: ch.snippet.title,
    uploadsPlaylistId: ch.contentDetails.relatedPlaylists.uploads,
  };
}

/** Fetch recent videos from an uploads playlist */
export async function getRecentVideos(
  uploadsPlaylistId: string,
  maxResults: number
): Promise<VideoInfo[]> {
  const all: VideoInfo[] = [];
  let pageToken: string | undefined;

  while (all.length < maxResults) {
    const params = new URLSearchParams({
      action: 'videos',
      playlistId: uploadsPlaylistId,
      maxResults: String(Math.min(50, maxResults - all.length)),
    });
    if (pageToken) params.set('pageToken', pageToken);

    const res = await fetch(`/api/pantry/youtube?${params}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    if (!data.items?.length) break;

    for (const item of data.items) {
      all.push({
        videoId: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
      });
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return all.slice(0, maxResults);
}

/** Fetch transcript for a video via the CF Function proxy */
export async function getTranscript(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/pantry/transcript?videoId=${encodeURIComponent(videoId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.text || null;
  } catch {
    return null;
  }
}
