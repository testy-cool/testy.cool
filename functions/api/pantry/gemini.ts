import { GoogleGenAI } from '@google/genai';

const MODEL = 'gemini-3-flash-preview';
const MAX_BODY = 16_384;

interface Env {
  GEMINI_API_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const key = context.env.GEMINI_API_KEY;
  if (!key) return new Response(JSON.stringify({ error: 'API key not configured' }), { status: 502 });

  const raw = await context.request.text();
  if (raw.length > MAX_BODY) {
    return new Response(JSON.stringify({ error: 'Request too large' }), { status: 413 });
  }

  let body: { contents: string; responseMimeType?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400 });
  }

  if (!body.contents || typeof body.contents !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing contents field' }), { status: 400 });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: key });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: body.contents,
      config: body.responseMimeType ? { responseMimeType: body.responseMimeType } : undefined,
    });

    return new Response(JSON.stringify({
      text: response.text,
      usageMetadata: response.usageMetadata,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Gemini error' }), { status: 502 });
  }
};
