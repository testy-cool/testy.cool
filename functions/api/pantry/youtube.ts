const YT_API = 'https://www.googleapis.com/youtube/v3';

interface Env {
  YOUTUBE_API_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const key = context.env.YOUTUBE_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: 'YouTube API key not configured' }), { status: 502 });

  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');

  let ytUrl: string;

  switch (action) {
    case 'channelInfo': {
      const handle = url.searchParams.get('handle');
      if (!handle) return new Response(JSON.stringify({ error: 'Missing handle' }), { status: 400 });
      const params = new URLSearchParams({ part: 'contentDetails,snippet', key });
      if (handle.startsWith('@')) params.set('forHandle', handle);
      else if (handle.startsWith('UC')) params.set('id', handle);
      else params.set('forHandle', '@' + handle);
      ytUrl = `${YT_API}/channels?${params}`;
      break;
    }
    case 'videos': {
      const playlistId = url.searchParams.get('playlistId');
      const maxResults = url.searchParams.get('maxResults') || '20';
      if (!playlistId) return new Response(JSON.stringify({ error: 'Missing playlistId' }), { status: 400 });
      const params = new URLSearchParams({
        part: 'snippet',
        playlistId,
        maxResults: String(Math.min(50, Number(maxResults))),
        key,
      });
      const pageToken = url.searchParams.get('pageToken');
      if (pageToken) params.set('pageToken', pageToken);
      ytUrl = `${YT_API}/playlistItems?${params}`;
      break;
    }
    case 'channelFromVideo': {
      const videoId = url.searchParams.get('videoId');
      if (!videoId) return new Response(JSON.stringify({ error: 'Missing videoId' }), { status: 400 });
      ytUrl = `${YT_API}/videos?${new URLSearchParams({ part: 'snippet', id: videoId, key })}`;
      break;
    }
    default:
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  }

  try {
    const res = await fetch(ytUrl);
    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'YouTube API error' }), { status: 502 });
  }
};
