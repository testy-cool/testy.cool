# Channel Pantry Deployment on testy.cool

## Summary

Deploy the Channel Pantry app as a standalone tool at `testy.cool/tools/channel-pantry`. API keys hidden behind Cloudflare Pages Functions. Open to anyone, no auth gate.

## Architecture

Three layers:

1. **Cloudflare Pages Functions** (`functions/api/pantry/`) - API proxy endpoints holding secrets
2. **Next.js client page** (`apps/web/app/(home)/tools/channel-pantry/page.tsx`) - mounts the React app
3. **Pantry React components + services** - ported into testy.cool codebase

### CF Functions (3 endpoints)

All functions read API keys from `context.env` (Cloudflare Pages environment secrets).

#### `POST /api/pantry/gemini`

Proxies Gemini 3 Flash calls. The function uses the `@google/genai` npm package server-side (not CDN). Model is hardcoded to `gemini-3-flash-preview` in the function (prevents proxy abuse for expensive models).

Request body from client:

```ts
{ contents: string; responseMimeType?: string }
```

The function constructs the full `ai.models.generateContent()` call, adding API key and model. Returns the Gemini response JSON including `text` and `usageMetadata` for client-side cost tracking.

Request body size capped at 16KB to prevent abuse.

#### `GET /api/pantry/youtube`

Proxies YouTube Data API v3 calls. Three actions:

- `?action=channelInfo&handle=X`
- `?action=videos&playlistId=X&maxResults=N&pageToken=TOKEN` (pageToken optional, for pagination)
- `?action=channelFromVideo&videoId=X`

Function adds the YouTube API key and forwards to `googleapis.com/youtube/v3/...`. Returns the YouTube API JSON as-is with the same HTTP status code. On function-level errors (missing params, fetch failures), returns `{ error: string }` with 400 or 502.

#### `GET /api/pantry/transcript?videoId=X`

Proxies YouTube Innertube ANDROID client for transcript extraction (bypasses CORS and POT token requirements). Returns `{ text: string }` (matches existing convention from Vite dev middleware).

### File Structure

```
testycool/
├── functions/
│   └── api/
│       └── pantry/
│           ├── gemini.ts          # POST - proxy Gemini calls
│           ├── youtube.ts         # GET  - proxy YouTube Data API
│           └── transcript.ts      # GET  - proxy Innertube transcripts
├── apps/web/
│   ├── app/(home)/tools/
│   │   ├── page.tsx               # Tools index (add channel-pantry entry)
│   │   └── channel-pantry/
│   │       └── page.tsx           # "use client" wrapper mounting PantryApp
│   ├── components/tools/channel-pantry/
│   │   ├── PantryApp.tsx          # Main app component (state + orchestration)
│   │   ├── ChannelInput.tsx       # Channel URL input form
│   │   ├── VideoCard.tsx          # YouTube-style video card with ingredient tags
│   │   ├── VideoGrid.tsx          # Responsive grid wrapper
│   │   └── LiveSummary.tsx        # Real-time category summary
│   └── lib/tools/channel-pantry/
│       ├── types.ts               # Pantry types (VideoInfo, VideoProgress, etc.)
│       ├── channelAnalyzerService.ts  # Orchestration (calls /api/pantry/gemini)
│       ├── youtubeService.ts      # Channel/video fetching (calls /api/pantry/youtube)
│       └── costTracker.ts         # Client-side token/cost tracking
```

### What's NOT Ported

- Recipe resolver (all of it)
- Product vectors / embedding / product index
- Vite config, import maps, pantry.html
- `@google/genai` CDN dependency (replaced by fetch to CF Function)
- The top-level `if (!process.env.API_KEY) throw` guard (keys are server-side now)

## Service Layer Changes

### channelAnalyzerService.ts

Current: imports `@google/genai`, creates `GoogleGenAI` client, calls `ai.models.generateContent()` directly with API key from env.

New: calls `fetch('/api/pantry/gemini', { method: 'POST', body: JSON.stringify({ contents, responseMimeType }) })`. Parses response JSON. Cost tracking reads `usageMetadata` from response. Remove the `process.env.API_KEY` guard and all `@google/genai` imports.

### youtubeService.ts

Current: calls YouTube Data API directly with API key from `process.env.YOUTUBE_API_KEY`.

New: calls `fetch('/api/pantry/youtube?action=...&param=...')`. The function adds the key server-side. Pagination uses `pageToken` param forwarded through the proxy.

`parseChannelInput()` stays as-is (pure client-side URL parsing, no API call).

Current transcript proxy: Vite dev middleware at `/api/transcript` returning `{ text: string }`.

New: `fetch('/api/pantry/transcript?videoId=X')`. CF Function uses Innertube ANDROID client. Response is `{ text: string }` (same field name as before).

### PantryApp.tsx SSR compatibility

The `localStorage` cache initialization must be SSR-safe for Next.js static export:

```ts
// Current (breaks during SSR):
const [cachedChannels, setCachedChannels] = useState<ChannelAnalysisResult[]>(loadCache);

// Fixed:
const [cachedChannels, setCachedChannels] = useState<ChannelAnalysisResult[]>([]);
useEffect(() => { setCachedChannels(loadCache()); }, []);
```

## Styling Adaptation

Current pantry app uses Tailwind CDN with Inter font. testy.cool uses Tailwind v4 with fumadocs CSS tokens.

Approach:
- Replace raw Tailwind color classes with fumadocs tokens where they map (e.g., `text-gray-900` -> `text-fd-foreground`, `bg-white` -> `bg-fd-card`, `border-gray-200` -> `border-fd-border`)
- Keep layout/spacing utilities as-is (they're framework-agnostic)
- Keep the Inter font (already used by testy.cool)
- CSS animations (fadeSlideIn, tagPop, shimmer) defined as `@keyframes` in `globals.css` (existing pattern, see `animate-move` keyframe already there)

## Tools Index Entry

Add to the `tools` array in `apps/web/app/(home)/tools/page.tsx`:

```ts
{
  slug: "channel-pantry",
  title: "Channel Pantry",
  description: "Analyze a YouTube cooking channel to see what ingredients they use most.",
  tags: ["YouTube", "AI", "Cooking"],
}
```

## Deployment

1. Add `GEMINI_API_KEY` and `YOUTUBE_API_KEY` as environment secrets in Cloudflare Pages dashboard
2. Push code - CF auto-deploys functions from `functions/` directory and static site from `apps/web/out/`
3. Verify tool entry appears on `/tools` index

## Security

- API keys never reach the browser - stored as CF environment secrets, accessed only in Functions
- Gemini model hardcoded server-side (prevents using proxy for expensive models)
- Request body size capped at 16KB on Gemini endpoint
- Functions validate request parameters before forwarding
- Error responses use appropriate HTTP status codes (400 for bad params, 502 for upstream failures)
- No auth gate (open to anyone) per user preference
- Cloudflare's built-in DDoS protection applies automatically

## Verification

1. `pnpm web:build` succeeds (static export)
2. `pnpm check-types` passes
3. Local test: `npx wrangler pages dev apps/web/out` serves the page and functions work
4. After deploy: open `testy.cool/tools/channel-pantry`, analyze a cooking channel, verify cards populate with ingredients and summary builds live
