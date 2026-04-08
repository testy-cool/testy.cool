import { GoogleGenAI } from "@google/genai";

const DEFAULT_MODEL = "gemini-3-flash-preview";
const ALLOWED_MODELS = ["gemini-3-flash-preview", "gemini-3.1-pro-preview"];
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days
const JOB_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const MAX_RECENT = 20;
const MAX_VERSIONS = 20;
const RECENT_KEY = "recent_tutorials";
const PROMPT_KEY = "config:tutorial_prompt";

interface Env {
  GEMINI_API_KEY?: string;
  PANTRY_CACHE: KVNamespace;
  LANGFUSE_SECRET_KEY?: string;
  LANGFUSE_PUBLIC_KEY?: string;
  LANGFUSE_BASE_URL?: string;
  WINDMILL_BASE_URL?: string;
  WINDMILL_TOKEN?: string;
  WINDMILL_WORKSPACE?: string;
  WINDMILL_SCRIPT_PATH?: string;
  WINDMILL_FLOW_PATH?: string;
  TUTORIAL_CALLBACK_SECRET?: string;
}

interface VersionMeta {
  currentVersion: number;
  versions: { version: number; generatedAt: number; prompt?: string }[];
}

interface TutorialPayload {
  videoId: string;
  videoTitle: string;
  title: string;
  summary?: string;
  category?: string;
  transcript?: string;
  incentiveAnalysis?: string;
  channelIncentive?: string;
  hypeLevel?: string;
  trustLevel?: string;
  evidenceLevel?: string;
  whoShouldCare?: string;
  steps: unknown[];
  generatedAt: number;
}

interface TutorialJobRecord {
  id: string;
  videoId: string;
  state: "queued" | "running" | "succeeded" | "failed";
  windmillJobId?: string;
  createdAt: number;
  updatedAt: number;
  error?: string;
  resultVersion?: number;
  model?: string;
  customNoteHash?: string;
  usedCustomPrompt?: boolean;
}

interface CallbackBody {
  action?: string;
  secret?: string;
  jobId?: string;
  success?: boolean;
  tutorial?: TutorialPayload;
  error?: string;
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function jobByVideoKey(videoId: string) {
  return `tutorial_job:video:${videoId}`;
}

function jobByIdKey(jobId: string) {
  return `tutorial_job:id:${jobId}`;
}

function normalizePublicJob(job: TutorialJobRecord | null) {
  if (!job) return null;
  return {
    id: job.id,
    videoId: job.videoId,
    state: job.state,
    windmillJobId: job.windmillJobId,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    error: job.error,
    resultVersion: job.resultVersion,
    model: job.model,
  };
}

async function getJobForVideo(kv: KVNamespace, videoId: string): Promise<TutorialJobRecord | null> {
  const raw = await kv.get(jobByVideoKey(videoId));
  return raw ? JSON.parse(raw) : null;
}

async function getJobById(kv: KVNamespace, id: string): Promise<TutorialJobRecord | null> {
  const raw = await kv.get(jobByIdKey(id));
  return raw ? JSON.parse(raw) : null;
}

async function putJob(kv: KVNamespace, job: TutorialJobRecord) {
  const serialized = JSON.stringify(job);
  await Promise.all([
    kv.put(jobByVideoKey(job.videoId), serialized, { expirationTtl: JOB_TTL_SECONDS }),
    kv.put(jobByIdKey(job.id), serialized, { expirationTtl: JOB_TTL_SECONDS }),
  ]);
}

async function getTutorialState(kv: KVNamespace, videoId: string) {
  const [rawTutorial, rawJob] = await Promise.all([
    kv.get(`tutorial:${videoId}`),
    kv.get(jobByVideoKey(videoId)),
  ]);
  const tutorial = rawTutorial ? JSON.parse(rawTutorial) : null;
  const job = rawJob ? (JSON.parse(rawJob) as TutorialJobRecord) : null;
  return {
    tutorial,
    job: normalizePublicJob(job),
    pending: job ? job.state === "queued" || job.state === "running" : false,
    ...(job?.state === "failed" && job.error ? { error: job.error } : {}),
  };
}

function hashNote(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash.toString(16);
}

function normalizeWindmillPath(path: string) {
  return path.replace(/^\/+/, "");
}

function getWindmillRunUrl(env: Env) {
  const base = env.WINDMILL_BASE_URL?.replace(/\/+$/, "");
  const workspace = env.WINDMILL_WORKSPACE?.trim() || "main";
  const flowPath = env.WINDMILL_FLOW_PATH?.trim();
  const scriptPath = env.WINDMILL_SCRIPT_PATH?.trim();
  if (!base || !env.WINDMILL_TOKEN) return null;
  if (flowPath) return `${base}/api/w/${workspace}/jobs/run/f/${normalizeWindmillPath(flowPath)}`;
  if (scriptPath) return `${base}/api/w/${workspace}/jobs/run/p/${normalizeWindmillPath(scriptPath)}`;
  return null;
}

async function startWindmillJob(
  env: Env,
  payload: Record<string, unknown>,
): Promise<{ windmillJobId: string }> {
  const runUrl = getWindmillRunUrl(env);
  if (!runUrl || !env.WINDMILL_TOKEN) {
    throw new Error("Windmill is not configured");
  }

  const res = await fetch(runUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.WINDMILL_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {}

  if (!res.ok) {
    const message =
      typeof data === "object" && data && "error" in data && typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Windmill request failed (${res.status})`;
    throw new Error(message);
  }

  const windmillJobId =
    typeof data === "string"
      ? data
      : typeof text === "string" && text.trim()
        ? text.trim()
      : typeof data === "object" && data
        ? (
            ("job_id" in data && typeof (data as { job_id?: unknown }).job_id === "string" && (data as { job_id: string }).job_id) ||
            ("jobId" in data && typeof (data as { jobId?: unknown }).jobId === "string" && (data as { jobId: string }).jobId) ||
            ("id" in data && typeof (data as { id?: unknown }).id === "string" && (data as { id: string }).id)
          )
        : null;

  if (!windmillJobId) throw new Error("Windmill did not return a job id");
  return { windmillJobId };
}

function ensureTutorialShape(videoId: string, tutorial: TutorialPayload | undefined): TutorialPayload {
  if (!tutorial || typeof tutorial !== "object") {
    throw new Error("Callback did not include tutorial data");
  }
  if (tutorial.videoId !== videoId) {
    throw new Error("Tutorial video id mismatch");
  }
  if (!tutorial.videoTitle || !tutorial.title) {
    throw new Error("Tutorial is missing required metadata");
  }
  if (!Array.isArray(tutorial.steps) || tutorial.steps.length === 0) {
    throw new Error("Tutorial did not contain any steps");
  }

  return {
    videoId,
    videoTitle: tutorial.videoTitle,
    title: tutorial.title,
    summary: tutorial.summary || "",
    category: tutorial.category || "",
    transcript: tutorial.transcript || "",
    incentiveAnalysis: tutorial.incentiveAnalysis || "",
    channelIncentive: tutorial.channelIncentive || "",
    hypeLevel: tutorial.hypeLevel || "",
    trustLevel: tutorial.trustLevel || "",
    evidenceLevel: tutorial.evidenceLevel || "",
    whoShouldCare: tutorial.whoShouldCare || "",
    steps: tutorial.steps,
    generatedAt: tutorial.generatedAt || Date.now(),
  };
}

async function persistTutorialResult(
  kv: KVNamespace,
  tutorial: TutorialPayload,
  usedCustomPrompt?: boolean,
): Promise<number> {
  const metaRaw = await kv.get(`tutorial:${tutorial.videoId}:meta`);
  const meta: VersionMeta = metaRaw
    ? JSON.parse(metaRaw)
    : { currentVersion: 0, versions: [] };

  const newVersion = meta.currentVersion + 1;
  meta.currentVersion = newVersion;
  meta.versions.push({
    version: newVersion,
    generatedAt: tutorial.generatedAt,
    prompt: usedCustomPrompt ? "(custom)" : undefined,
  });

  if (meta.versions.length > MAX_VERSIONS) {
    const dropped = meta.versions.splice(0, meta.versions.length - MAX_VERSIONS);
    await Promise.all(dropped.map((d) => kv.delete(`tutorial:${tutorial.videoId}:v${d.version}`)));
  }

  await Promise.all([
    kv.put(`tutorial:${tutorial.videoId}:v${newVersion}`, JSON.stringify(tutorial), {
      expirationTtl: TTL_SECONDS,
    }),
    kv.put(`tutorial:${tutorial.videoId}:meta`, JSON.stringify(meta), {
      expirationTtl: TTL_SECONDS,
    }),
    kv.put(`tutorial:${tutorial.videoId}`, JSON.stringify(tutorial), {
      expirationTtl: TTL_SECONDS,
    }),
  ]);

  const raw = await kv.get(RECENT_KEY);
  const recent: { videoId: string }[] = raw ? JSON.parse(raw) : [];
  const summary = {
    videoId: tutorial.videoId,
    title: tutorial.title,
    category: tutorial.category,
    stepCount: tutorial.steps.length,
    timestamp: Date.now(),
  };
  const updated = [
    summary,
    ...recent.filter((t) => t.videoId !== tutorial.videoId),
  ].slice(0, MAX_RECENT);
  await kv.put(RECENT_KEY, JSON.stringify(updated));

  return newVersion;
}

async function handleCallback(context: EventContext<Env, string, unknown>, body: CallbackBody) {
  const kv = context.env.PANTRY_CACHE;
  if (!kv) return json({ error: "KV not configured" }, 502);

  const headerSecret = context.request.headers.get("x-tutorial-callback-secret");
  const expectedSecret = context.env.TUTORIAL_CALLBACK_SECRET;
  if (!expectedSecret || (body.secret !== expectedSecret && headerSecret !== expectedSecret)) {
    return json({ error: "Invalid callback secret" }, 403);
  }

  if (!body.jobId || typeof body.jobId !== "string") {
    return json({ error: "Missing jobId" }, 400);
  }

  const job = await getJobById(kv, body.jobId);
  if (!job) return json({ error: "Unknown job" }, 404);

  const now = Date.now();
  if (body.success) {
    try {
      const tutorial = ensureTutorialShape(job.videoId, body.tutorial);
      const version = await persistTutorialResult(kv, tutorial, job.usedCustomPrompt);
      await langfuseTrace(context.env, {
        traceId: `tut-${job.id}`,
        name: `tutorial:${job.videoId}`,
        input: {
          videoId: job.videoId,
          model: job.model,
          jobId: job.id,
          mode: "windmill-callback",
        },
        output: tutorial,
        model: job.model || DEFAULT_MODEL,
        startTime: new Date(job.createdAt).toISOString(),
        endTime: new Date(now).toISOString(),
        metadata: {
          videoId: job.videoId,
          windmillJobId: job.windmillJobId,
          resultVersion: version,
          stepCount: tutorial.steps.length,
        },
      });
      const updatedJob: TutorialJobRecord = {
        ...job,
        state: "succeeded",
        updatedAt: now,
        error: undefined,
        resultVersion: version,
      };
      await putJob(kv, updatedJob);
      return json({ ok: true, version });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to persist tutorial";
      const failedJob: TutorialJobRecord = {
        ...job,
        state: "failed",
        updatedAt: now,
        error: message,
      };
      await putJob(kv, failedJob);
      return json({ error: message }, 400);
    }
  }

  const message = typeof body.error === "string" && body.error.trim()
    ? body.error.trim()
    : "Tutorial generation failed.";
  await langfuseTrace(context.env, {
    traceId: `tut-${job.id}`,
    name: `tutorial:${job.videoId}`,
    input: {
      videoId: job.videoId,
      model: job.model,
      jobId: job.id,
      mode: "windmill-callback",
    },
    output: { error: message },
    model: job.model || DEFAULT_MODEL,
    startTime: new Date(job.createdAt).toISOString(),
    endTime: new Date(now).toISOString(),
    metadata: {
      videoId: job.videoId,
      windmillJobId: job.windmillJobId,
      failed: true,
    },
  });
  const updatedJob: TutorialJobRecord = {
    ...job,
    state: "failed",
    updatedAt: now,
    error: message,
  };
  await putJob(kv, updatedJob);
  return json({ ok: true });
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const kv = context.env.PANTRY_CACHE;
  if (!kv) return json({ error: "KV not configured" }, 502);

  const url = new URL(context.request.url);
  const action = url.searchParams.get("action");
  const videoId = url.searchParams.get("videoId");

  if (action === "recent") {
    const raw = await kv.get(RECENT_KEY);
    return json({ tutorials: raw ? JSON.parse(raw) : [] });
  }

  if (action === "prompt") {
    const stored = await kv.get(PROMPT_KEY);
    return json({ prompt: stored || buildPrompt("{videoTitle}") });
  }

  if (action === "versions" && videoId) {
    const metaRaw = await kv.get(`tutorial:${videoId}:meta`);
    if (!metaRaw) return json({ versions: [] });
    const meta: VersionMeta = JSON.parse(metaRaw);
    return json({ versions: meta.versions });
  }

  if (action === "version" && videoId) {
    const v = url.searchParams.get("v");
    if (!v) return json({ error: "Missing version number" }, 400);
    const raw = await kv.get(`tutorial:${videoId}:v${v}`);
    return json({ tutorial: raw ? JSON.parse(raw) : null });
  }

  if (action === "job") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing job id" }, 400);
    const job = await getJobById(kv, id);
    return json({ job: normalizePublicJob(job) });
  }

  if (action === "conversations" && videoId) {
    const raw = await kv.get(`chat:${videoId}:index`);
    return json({ conversations: raw ? JSON.parse(raw) : [] });
  }

  if (action === "conversation" && videoId) {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing conversation id" }, 400);
    const raw = await kv.get(`chat:${videoId}:${id}`);
    return json({ conversation: raw ? JSON.parse(raw) : null });
  }

  if (videoId) {
    return json(await getTutorialState(kv, videoId));
  }

  return json({ error: "Missing action or videoId" }, 400);
};

export const onRequestPut: PagesFunction<Env> = async (context) => {
  const kv = context.env.PANTRY_CACHE;
  if (!kv) return json({ error: "KV not configured" }, 502);

  let body: { action?: string; prompt?: string; password?: string };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (body.action === "updatePrompt") {
    if (body.password !== "penis") {
      return json({ error: "Invalid password" }, 403);
    }
    if (body.prompt === "__reset__") {
      await kv.delete(PROMPT_KEY);
      return json({ success: true, reset: true });
    }
    if (!body.prompt || typeof body.prompt !== "string") {
      return json({ error: "Missing prompt" }, 400);
    }
    await kv.put(PROMPT_KEY, body.prompt);
    return json({ success: true });
  }

  return json({ error: "Unknown action" }, 400);
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const kv = context.env.PANTRY_CACHE;
  if (!kv) return json({ error: "KV not configured" }, 502);
  const url = new URL(context.request.url);
  const actionFromUrl = url.searchParams.get("action");

  let body: {
    action?: string;
    videoId?: string;
    force?: boolean;
    model?: string;
    customNote?: string;
    message?: string;
    history?: { role: string; text: string }[];
    convId?: string;
    parentId?: string;
    secret?: string;
    jobId?: string;
    success?: boolean;
    tutorial?: TutorialPayload;
    error?: string;
  };
  try {
    body = await context.request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (body.action === "callback" || actionFromUrl === "callback") {
    return handleCallback(context, body);
  }

  if (body.action === "chat") {
    if (!context.env.GEMINI_API_KEY) {
      return json({ error: "Gemini API key not configured" }, 502);
    }
    return handleChat(
      context.env,
      body.videoId || "",
      body.message || "",
      body.history || [],
      body.convId,
      body.parentId,
    );
  }

  const videoId = body.videoId;
  const force = !!body.force;
  const customNote = typeof body.customNote === "string" ? body.customNote.slice(0, 500) : "";
  const model = body.model && ALLOWED_MODELS.includes(body.model) ? body.model : DEFAULT_MODEL;
  if (!videoId || typeof videoId !== "string") {
    return json({ error: "Missing videoId" }, 400);
  }

  const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;
  if (!VIDEO_ID_REGEX.test(videoId)) {
    return json({ error: "Invalid video ID format" }, 400);
  }

  const currentTutorialRaw = await kv.get(`tutorial:${videoId}`);
  let currentTutorial = currentTutorialRaw ? JSON.parse(currentTutorialRaw) : null;
  if (currentTutorial && (!currentTutorial.steps || currentTutorial.steps.length === 0)) {
    await kv.delete(`tutorial:${videoId}`);
    currentTutorial = null;
  }

  if (!force && currentTutorial && currentTutorial.steps?.length > 0) {
    return json({ tutorial: currentTutorial, cached: true });
  }

  const existingJob = await getJobForVideo(kv, videoId);
  if (existingJob && (existingJob.state === "queued" || existingJob.state === "running")) {
    return json({
      tutorial: currentTutorial || undefined,
      job: normalizePublicJob(existingJob),
      status: existingJob.state,
    });
  }

  const ip = context.request.headers.get("cf-connecting-ip") || "unknown";
  const rateLimitKey = `ratelimit:${ip}`;
  const rateLimitRaw = await kv.get(rateLimitKey);
  const rateLimitCount = rateLimitRaw ? parseInt(rateLimitRaw, 10) : 0;
  if (rateLimitCount >= 10) {
    return json(
      { error: "Rate limit exceeded. Max 10 generations per hour." },
      429,
    );
  }
  await kv.put(rateLimitKey, String(rateLimitCount + 1), {
    expirationTtl: 3600,
  });

  const runUrl = getWindmillRunUrl(context.env);
  if (!runUrl || !context.env.WINDMILL_TOKEN || !context.env.TUTORIAL_CALLBACK_SECRET) {
    return json({ error: "Windmill queue is not configured" }, 502);
  }

  const storedPrompt = await kv.get(PROMPT_KEY);
  const job: TutorialJobRecord = {
    id: crypto.randomUUID(),
    videoId,
    state: "queued",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    model,
    customNoteHash: customNote ? hashNote(customNote) : undefined,
    usedCustomPrompt: !!storedPrompt,
  };
  await putJob(kv, job);

  const callbackUrl = new URL(context.request.url);
  callbackUrl.search = "?action=callback";
  const payload = {
    jobId: job.id,
    videoId,
    force,
    model,
    customNote,
    promptTemplate: enforcePromptSchema(storedPrompt || "", "{videoTitle}"),
    callbackUrl: callbackUrl.toString(),
    callbackSecret: context.env.TUTORIAL_CALLBACK_SECRET,
  };

  try {
    const { windmillJobId } = await startWindmillJob(context.env, payload);
    const runningJob: TutorialJobRecord = {
      ...job,
      state: "running",
      windmillJobId,
      updatedAt: Date.now(),
    };
    await putJob(kv, runningJob);
    return json({
      tutorial: currentTutorial || undefined,
      job: normalizePublicJob(runningJob),
      status: runningJob.state,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to start queued generation";
    const failedJob: TutorialJobRecord = {
      ...job,
      state: "failed",
      updatedAt: Date.now(),
      error: message,
    };
    await putJob(kv, failedJob);
    return json({ error: message }, 502);
  }
};

async function handleChat(
  env: Env,
  videoId: string,
  message: string,
  history: { role: string; text: string }[],
  convId?: string,
  parentId?: string,
): Promise<Response> {
  if (!videoId || !message) return json({ error: "Missing videoId or message" }, 400);

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) return json({ error: "Gemini API key not configured" }, 502);

  const kv = env.PANTRY_CACHE;
  if (!kv) return json({ error: "KV not configured" }, 502);

  const raw = await kv.get(`tutorial:${videoId}`);
  if (!raw) return json({ error: "No tutorial found for this video. Generate one first." }, 404);

  const tutorial = JSON.parse(raw);
  const context = [
    `Video: "${tutorial.videoTitle}"`,
    `Breakdown title: "${tutorial.title}"`,
    tutorial.summary ? `Summary: ${tutorial.summary}` : "",
    tutorial.transcript ? `\nTRANSCRIPT:\n${tutorial.transcript}` : "",
    `\nBREAKDOWN CONTENT:\n${tutorial.steps.map((s: any, i: number) => `[${i + 1}] ${s.tag}: ${s.title}\n${s.blocks.map((b: any) => b.html || b.code || "").join("\n")}`).join("\n\n")}`,
  ].filter(Boolean).join("\n");

  const systemPrompt = `You have access to a video breakdown and its full transcript. Answer the user's question based on this content. Be direct and specific. Reference timestamps when relevant. If the answer isn't in the content, say so.\n\n${context}`;

  const ai = new GoogleGenAI({ apiKey });
  const contents = [
    { role: "user" as const, parts: [{ text: systemPrompt }] },
    { role: "model" as const, parts: [{ text: "Understood. I have the full breakdown and transcript. Ask me anything about this video." }] },
    ...history.map((h) => ({
      role: (h.role === "user" ? "user" : "model") as "user" | "model",
      parts: [{ text: h.text }],
    })),
    { role: "user" as const, parts: [{ text: message }] },
  ];

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents,
    });

    const reply = response.text || "No response generated.";

    const id = convId || crypto.randomUUID().slice(0, 8);
    const allMessages = [...history, { role: "user", text: message }, { role: "model", text: reply }];
    const conv = {
      id,
      videoId,
      parentId: parentId || null,
      messages: allMessages,
      createdAt: Date.now(),
    };
    await kv.put(`chat:${videoId}:${id}`, JSON.stringify(conv), { expirationTtl: TTL_SECONDS });

    const indexRaw = await kv.get(`chat:${videoId}:index`);
    const index: { id: string; preview: string; messageCount: number; createdAt: number; parentId?: string }[] =
      indexRaw ? JSON.parse(indexRaw) : [];
    const existing = index.findIndex((c) => c.id === id);
    const entry = {
      id,
      preview: message.slice(0, 80),
      messageCount: allMessages.length,
      createdAt: existing >= 0 ? index[existing].createdAt : Date.now(),
      parentId: parentId || undefined,
    };
    if (existing >= 0) {
      index[existing] = entry;
    } else {
      index.unshift(entry);
    }
    await kv.put(`chat:${videoId}:index`, JSON.stringify(index.slice(0, 50)), { expirationTtl: TTL_SECONDS });

    return json({ reply, convId: id });
  } catch (e: unknown) {
    return json({ error: e instanceof Error ? e.message : "Chat failed" }, 500);
  }
}

function buildPrompt(videoTitle: string): string {
  return `You're a cynical tech writer who values people's time. Someone sent you a video. You don't want to watch it either, but you did, and now you're going to save everyone else the trouble.

Your job: rip through the video, extract what's actually useful, call out the bullshit, and present it as a visual, scannable breakdown that takes 2 minutes to read instead of 20 minutes to watch.

Video title: "${videoTitle}"

## FORMAT

Each block: { type: "any string", html: "raw HTML with inline styles", caption?: "optional" }
Special: { type: "code", language: "...", code: "..." } for code blocks.
Special: { type: "screenshot", timestamp: 123, caption: "..." } for video seek buttons.

Everything else is your HTML. No templates, no components. You decide the layout.

## COLORS (CSS vars for dark/light mode)

Use hsl(var(--fd-foreground)) for body text (NOT --fd-muted-foreground, that's too faded). Use hsl(var(--fd-muted-foreground)) ONLY for labels/captions. Other vars: hsl(var(--fd-border)), hsl(var(--fd-primary)), hsl(var(--fd-card)), hsl(var(--fd-muted)). Opacity: hsl(var(--fd-primary) / 0.15). Fixed colors fine: #22c55e #ef4444 #f59e0b #3b82f6.

## STRUCTURE

- 5-15 sections chronologically, no timestamp gaps. endSeconds = next startSeconds.
- tagType: "intro" | "concept" | "setup" | "action"
- title: SHORT (under 60 chars). Descriptive, not meta. Never mention "breakdown", "cynical", "honest", "brutal" in the title. Just say what the video is about.
- summary: 2-4 SHORT sentences. Use <br> between sentences for line breaks. Is this worth my time? What's the actual point? Don't be polite.
- category: ONE word for the topic niche. Pick from existing: "AI", "Web Dev", "DevOps", "Design", "Data", "Security", "Mobile", "Gaming", "Hardware", "Cooking", "Finance", "Music", "Science", "Productivity". Only create a new category if none fit. Be conservative.
- transcript: Full transcript of what's said in the video. Include timestamps. Format: "0:00 - Speaker says this thing.\n0:45 - Then they explain that." Capture ALL dialogue, not just highlights.
- channelIncentive: 1-3 blunt sentences. What does the creator/channel stand to gain from making this video?
- hypeLevel: one of "low", "medium", "high"
- trustLevel: one of "low", "mixed", "high"
- evidenceLevel: one of "low", "medium", "high"
- whoShouldCare: 1-2 sentences. Which professions or viewers should care, and who can safely ignore it?
- incentiveAnalysis: Short HTML (3-5 sentences) on the creator's incentive. Is their expertise PRIMARY with competitive stakes (coaches whose athletes must perform, pros whose clients can sue), or SECONDARY content-creator economics (ads/affiliates/supplements/courses where bad advice still gets views)? Note red flags: selling what they teach, hidden sponsors, credentials that don't match claims. Be cynical. Start with a colored verdict using SINGLE QUOTES in the style attribute so JSON stays valid: <strong style='color:#22c55e'>High trust:</strong> or <strong style='color:#f59e0b'>Mixed:</strong> or <strong style='color:#ef4444'>Low trust:</strong>. Then the reasoning. Use <br> between sentences.

## OUTPUT (return ONLY valid JSON):
{
  "title": "Short Descriptive Title About The Topic",
  "category": "AI",
  "summary": "First sentence about what this is.<br>Second sentence about whether it's worth watching.<br>Third sentence with the cynical take.",
  "transcript": "0:00 - Full transcript with timestamps...",
  "channelIncentive": "The creator wants attention, authority, leads, or affiliate revenue from this topic.",
  "hypeLevel": "high",
  "trustLevel": "mixed",
  "evidenceLevel": "medium",
  "whoShouldCare": "Engineers or designers evaluating this exact workflow should care. Everyone else can skip it.",
  "incentiveAnalysis": "<strong style='color:#f59e0b'>Mixed:</strong> Full-time YouTuber whose income is ad revenue and sponsor segments.<br>Main skill is making videos, not doing the thing at a competitive level.<br>Advice is directionally useful but optimized for watch-time.",
  "steps": [{ "startSeconds": 0, "endSeconds": 120, "tag": "Label", "tagType": "intro", "title": "...", "blocks": [{ "type": "...", "html": "..." }] }]
}`;
}

function enforcePromptSchema(promptTemplate: string, videoTitle: string): string {
  const canonical = buildPrompt(videoTitle);
  if (!promptTemplate.trim()) return canonical;

  return `${promptTemplate}

## NON-NEGOTIABLE OUTPUT FIELDS

You must return valid JSON with ALL of these top-level fields:
- title
- category
- summary
- transcript
- channelIncentive
- hypeLevel
- trustLevel
- evidenceLevel
- whoShouldCare
- incentiveAnalysis
- steps

Allowed enums:
- hypeLevel: "low" | "medium" | "high"
- trustLevel: "low" | "mixed" | "high"
- evidenceLevel: "low" | "medium" | "high"

Do not omit the new top-level fields even if the earlier prompt forgets them.
Video title: "${videoTitle}"`;
}

async function langfuseTrace(
  env: Env,
  opts: {
    traceId: string;
    name: string;
    input: unknown;
    output: unknown;
    model: string;
    startTime: string;
    endTime: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  const { LANGFUSE_SECRET_KEY, LANGFUSE_PUBLIC_KEY, LANGFUSE_BASE_URL } = env;
  if (!LANGFUSE_SECRET_KEY || !LANGFUSE_PUBLIC_KEY || !LANGFUSE_BASE_URL) return;

  const payload = {
    batch: [
      {
        id: crypto.randomUUID(),
        type: "trace-create",
        timestamp: opts.startTime,
        body: {
          id: opts.traceId,
          name: opts.name,
          input: opts.input,
          output: opts.output,
          metadata: opts.metadata,
        },
      },
      {
        id: crypto.randomUUID(),
        type: "generation-create",
        timestamp: opts.startTime,
        body: {
          id: `gen-${opts.traceId}`,
          traceId: opts.traceId,
          name: `${opts.model} generation`,
          model: opts.model,
          input: opts.input,
          output: opts.output,
          startTime: opts.startTime,
          endTime: opts.endTime,
          metadata: opts.metadata,
        },
      },
    ],
  };

  try {
    await fetch(`${LANGFUSE_BASE_URL}/api/public/ingestion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${LANGFUSE_PUBLIC_KEY}:${LANGFUSE_SECRET_KEY}`)}`,
      },
      body: JSON.stringify(payload),
    });
  } catch {}
}
