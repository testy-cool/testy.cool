export const onRequestGet: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const videoId = url.searchParams.get('videoId') || url.searchParams.get('v');
  if (!videoId) {
    return new Response(JSON.stringify({ error: 'Missing videoId' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await watchRes.text();
    const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
    if (!apiKeyMatch) {
      return new Response(JSON.stringify({ error: 'Could not extract API key' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const playerRes = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKeyMatch[1]}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: { client: { clientName: 'ANDROID', clientVersion: '20.10.38' } },
        videoId,
      }),
    });
    const playerData = await playerRes.json() as any;
    const tracks = playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!tracks || tracks.length === 0) {
      return new Response(JSON.stringify({ error: 'No captions available' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const enTrack = tracks.find((t: any) => t.languageCode === 'en') || tracks[0];
    const captionRes = await fetch(enTrack.baseUrl.replace(/&fmt=\w+$/, ''));
    const xml = await captionRes.text();
    if (!xml) {
      return new Response(JSON.stringify({ error: 'Empty transcript' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const text = [...xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g)]
      .map(m => m[1])
      .join(' ')
      .replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();

    return new Response(JSON.stringify({ text }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
