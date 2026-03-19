/**
 * Cloudflare Pages Function that intercepts /tools/video-tutorial requests.
 * When ?v=VIDEO_ID is present, injects OG meta tags + JSON-LD from cached tutorial data.
 * This makes social sharing (Twitter, Discord, Slack) show the right title + thumbnail.
 */

interface Env {
  PANTRY_CACHE: KVNamespace;
  ASSETS: Fetcher;
}

interface TutorialCache {
  videoId: string;
  videoTitle: string;
  title: string;
  steps: { startSeconds: number; endSeconds: number; tag: string; title: string; blocks: { type: string; html?: string; caption?: string }[] }[];
  generatedAt: number;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export const onRequest: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url);
  const videoId = url.searchParams.get("v");

  // No video ID — serve the static page as-is
  if (!videoId) {
    return context.env.ASSETS.fetch(context.request);
  }

  const kv = context.env.PANTRY_CACHE;

  // Fetch the static HTML
  const assetResponse = await context.env.ASSETS.fetch(context.request);
  const html = await assetResponse.text();

  // Try to load cached tutorial
  let tutorial: TutorialCache | null = null;
  if (kv) {
    try {
      const raw = await kv.get(`tutorial:${videoId}`);
      if (raw) tutorial = JSON.parse(raw);
    } catch {}
  }

  if (!tutorial) {
    // No cached tutorial — still inject basic OG tags from video ID
    const ogTags = buildBasicOgTags(videoId);
    const modified = html.replace("</head>", `${ogTags}\n</head>`);
    return new Response(modified, {
      headers: { ...Object.fromEntries(assetResponse.headers), "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Build rich meta tags + JSON-LD from tutorial data
  const metaTags = buildRichMetaTags(tutorial);
  const jsonLd = buildJsonLd(tutorial, url.toString());
  const modified = html.replace("</head>", `${metaTags}\n${jsonLd}\n</head>`);

  return new Response(modified, {
    headers: { ...Object.fromEntries(assetResponse.headers), "Content-Type": "text/html; charset=utf-8" },
  });
};

function buildBasicOgTags(videoId: string): string {
  const thumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  return `
    <meta property="og:image" content="${thumb}" />
    <meta property="og:image:width" content="1280" />
    <meta property="og:image:height" content="720" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:image" content="${thumb}" />`;
}

function buildRichMetaTags(tutorial: TutorialCache): string {
  const title = escapeHtml(`${tutorial.title} — Interactive Tutorial`);
  const thumb = `https://img.youtube.com/vi/${tutorial.videoId}/maxresdefault.jpg`;
  const stepCount = tutorial.steps.length;
  const description = escapeHtml(
    `${stepCount}-chapter interactive tutorial with scroll-synced video. Generated from "${tutorial.videoTitle}" on YouTube.`
  );

  return `
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${thumb}" />
    <meta property="og:image:width" content="1280" />
    <meta property="og:image:height" content="720" />
    <meta property="og:type" content="article" />
    <meta name="description" content="${description}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${thumb}" />`;
}

function buildJsonLd(tutorial: TutorialCache, pageUrl: string): string {
  const lastStep = tutorial.steps[tutorial.steps.length - 1];
  const durationSeconds = lastStep ? lastStep.endSeconds : 0;
  const durationISO = `PT${Math.floor(durationSeconds / 60)}M${durationSeconds % 60}S`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: tutorial.title,
        description: `${tutorial.steps.length}-chapter interactive tutorial generated from "${tutorial.videoTitle}"`,
        image: `https://img.youtube.com/vi/${tutorial.videoId}/maxresdefault.jpg`,
        url: pageUrl,
        datePublished: new Date(tutorial.generatedAt).toISOString(),
        publisher: {
          "@type": "Organization",
          name: "testy.cool",
          url: "https://testy.cool",
        },
        articleSection: tutorial.steps.map((s) => s.title),
      },
      {
        "@type": "VideoObject",
        name: tutorial.videoTitle,
        description: `Source video for "${tutorial.title}"`,
        thumbnailUrl: `https://img.youtube.com/vi/${tutorial.videoId}/maxresdefault.jpg`,
        embedUrl: `https://www.youtube.com/embed/${tutorial.videoId}`,
        contentUrl: `https://www.youtube.com/watch?v=${tutorial.videoId}`,
        duration: durationISO,
      },
    ],
  };

  return `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`;
}
