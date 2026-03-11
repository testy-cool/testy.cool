interface Env {
  PANTRY_CACHE: KVNamespace;
}

interface ChannelSummary {
  channelId: string;
  channelTitle: string;
  videoCount: number;
  ingredientCount: number;
  timestamp: number;
}

const RECENT_KEY = 'recent_channels';
const MAX_RECENT = 30;
const TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const kv = context.env.PANTRY_CACHE;
  if (!kv) return new Response(JSON.stringify({ error: 'KV not configured' }), { status: 502 });

  const url = new URL(context.request.url);
  const action = url.searchParams.get('action');
  const channelId = url.searchParams.get('channelId');

  if (action === 'recent') {
    const raw = await kv.get(RECENT_KEY);
    const recent: ChannelSummary[] = raw ? JSON.parse(raw) : [];
    return new Response(JSON.stringify({ channels: recent }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (channelId) {
    const raw = await kv.get(`channel:${channelId}`);
    return new Response(JSON.stringify({ result: raw ? JSON.parse(raw) : null }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ error: 'Missing action or channelId' }), { status: 400 });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const kv = context.env.PANTRY_CACHE;
  if (!kv) return new Response(JSON.stringify({ error: 'KV not configured' }), { status: 502 });

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  const { channelId, result } = body;
  if (!channelId || !result) {
    return new Response(JSON.stringify({ error: 'Missing channelId or result' }), { status: 400 });
  }

  // Save the full result
  await kv.put(`channel:${channelId}`, JSON.stringify(result), { expirationTtl: TTL_SECONDS });

  // Update recent list
  const raw = await kv.get(RECENT_KEY);
  const recent: ChannelSummary[] = raw ? JSON.parse(raw) : [];
  const summary: ChannelSummary = {
    channelId: result.channelId,
    channelTitle: result.channelTitle,
    videoCount: result.videosAnalyzed,
    ingredientCount: result.ingredients?.length || 0,
    timestamp: Date.now(),
  };
  const updated = [summary, ...recent.filter(c => c.channelId !== channelId)].slice(0, MAX_RECENT);
  await kv.put(RECENT_KEY, JSON.stringify(updated));

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};
