import json
import re
import time
import uuid
from html import unescape

import requests
import wmill

# extra_requirements:
# requests


def iso_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def clip_text(value: str, max_chars: int = 600) -> str:
    if not value:
        return ""
    if len(value) <= max_chars:
        return value
    return value[:max_chars] + "... [truncated]"


def build_prompt(video_title: str) -> str:
    return f"""You're a cynical tech writer who values people's time. Someone sent you a video. You don't want to watch it either, but you did, and now you're going to save everyone else the trouble.

Your job: rip through the video, extract what's actually useful, call out the bullshit, and present it as a visual, scannable breakdown that takes 2 minutes to read instead of 20 minutes to watch.

Video title: "{video_title}"

## FORMAT

Each block: {{ type: "any string", html: "raw HTML with inline styles", caption?: "optional" }}
Special: {{ type: "code", language: "...", code: "..." }} for code blocks.
Special: {{ type: "screenshot", timestamp: 123, caption: "..." }} for video seek buttons.

Everything else is your HTML. No templates, no components. You decide the layout.

## COLORS (CSS vars for dark/light mode)

Use hsl(var(--fd-foreground)) for body text (NOT --fd-muted-foreground, that's too faded). Use hsl(var(--fd-muted-foreground)) ONLY for labels/captions. Other vars: hsl(var(--fd-border)), hsl(var(--fd-primary)), hsl(var(--fd-card)), hsl(var(--fd-muted)). Opacity: hsl(var(--fd-primary) / 0.15). Fixed colors fine: #22c55e #ef4444 #f59e0b #3b82f6.

## STRUCTURE

- First section must start with the bottom line immediately. No warm-up.
- Open with a blunt verdict in the first block: is it good, is it useful, is it lying, and is it worth the time.
- The first section must also tell the reader who should care, who can skip it, and the biggest caveat.
- Assume the reader may leave after 10 seconds. Front-load the payoff.
- 5-15 sections chronologically, no timestamp gaps. endSeconds = next startSeconds.
- tagType: "intro" | "concept" | "setup" | "action"
- title: SHORT (under 60 chars). Descriptive, not meta. Never mention "breakdown", "cynical", "honest", "brutal" in the title. Just say what the video is about.
- summary: 2-4 SHORT sentences. Use <br> between sentences for line breaks. Sentence 1 must be the bottom line. Is this worth my time? What's the actual point? Don't be polite.
- category: ONE word for the topic niche. Pick from existing: "AI", "Web Dev", "DevOps", "Design", "Data", "Security", "Mobile", "Gaming", "Hardware", "Cooking", "Finance", "Music", "Science", "Productivity". Only create a new category if none fit. Be conservative.
- transcript: Full transcript of what's said in the video. Include timestamps. Format: "0:00 - Speaker says this thing.\\n0:45 - Then they explain that." Capture ALL dialogue, not just highlights.
- channelIncentive: 2-4 blunt sentences. Explain what the creator/channel stands to gain, who benefits if the viewer buys the framing, and the concrete end-state win. Name the money, lock-in, status, leads, access, or platform advantage directly.
- hypeLevel: one of "low", "medium", "high"
- trustLevel: one of "low", "mixed", "high"
- evidenceLevel: one of "low", "medium", "high"
- whoShouldCare: 1-2 blunt sentences. Which professions or viewers should care, and who can skip?
- whatToDoAboutIt: 2-4 blunt sentences. Tell the reader what to do in response. Be concrete. Example actions: verify with neutral sources, demand benchmarks, treat it as marketing until proven otherwise, copy the useful part without buying the whole stack.
- incentiveAnalysis: Short HTML (3-5 sentences) on the creator's incentive. Is their expertise PRIMARY with competitive stakes (coaches whose athletes must perform, pros whose clients can sue), or SECONDARY content-creator economics (ads/affiliates/supplements/courses where bad advice still gets views)? Note red flags: selling what they teach, hidden sponsors, credentials that don't match claims. Be cynical. Start with a colored verdict using SINGLE QUOTES in the style attribute so JSON stays valid: <strong style='color:#22c55e'>High trust:</strong> or <strong style='color:#f59e0b'>Mixed:</strong> or <strong style='color:#ef4444'>Low trust:</strong>. Then the reasoning. Use <br> between sentences.

## OUTPUT (return ONLY valid JSON):
{{
  "title": "Short Descriptive Title About The Topic",
  "category": "AI",
  "summary": "First sentence about what this is.<br>Second sentence about whether it's worth watching.<br>Third sentence with the cynical take.",
  "transcript": "0:00 - Full transcript with timestamps...",
  "channelIncentive": "The creator wants attention, authority, affiliate clicks, leads, sponsorship leverage, or platform advantage from this topic.",
  "hypeLevel": "high",
  "trustLevel": "mixed",
  "evidenceLevel": "medium",
  "whoShouldCare": "People actively deciding whether to use this idea should care. Everyone else can skip it.",
  "whatToDoAboutIt": "Take the useful idea, but do not buy the whole framing on trust. Verify the big claims elsewhere before you commit time, money, or stack decisions.",
  "incentiveAnalysis": "<strong style='color:#f59e0b'>Mixed:</strong> Full-time YouTuber whose income is ad revenue and sponsor segments.<br>Main skill is making videos, not doing the thing at a competitive level.<br>Advice is directionally useful but optimized for watch-time.",
  "steps": [{{ "startSeconds": 0, "endSeconds": 120, "tag": "Label", "tagType": "intro", "title": "...", "blocks": [{{ "type": "...", "html": "..." }}] }}]
}}"""


def get_video_title(video_id: str) -> str:
    try:
        res = requests.get(
            "https://www.youtube.com/oembed",
            params={"url": f"https://www.youtube.com/watch?v={video_id}", "format": "json"},
            timeout=20,
        )
        data = res.json()
        return data.get("title") or "Untitled Video"
    except Exception:
        return "Untitled Video"


def get_transcript_segments(video_id: str) -> list[dict]:
    watch_res = requests.get(f"https://www.youtube.com/watch?v={video_id}", timeout=30)
    watch_res.raise_for_status()
    html = watch_res.text
    api_key_match = re.search(r'"INNERTUBE_API_KEY":"([^"]+)"', html)
    if not api_key_match:
        return []

    player_res = requests.post(
        f"https://www.youtube.com/youtubei/v1/player?key={api_key_match.group(1)}",
        json={
            "context": {"client": {"clientName": "ANDROID", "clientVersion": "20.10.38"}},
            "videoId": video_id,
        },
        timeout=30,
    )
    player_res.raise_for_status()
    player_data = player_res.json()
    tracks = (
        player_data.get("captions", {})
        .get("playerCaptionsTracklistRenderer", {})
        .get("captionTracks")
    )
    if not tracks:
        return []

    en_track = next((track for track in tracks if track.get("languageCode") == "en"), tracks[0])
    caption_res = requests.get(re.sub(r"&fmt=\w+$", "", en_track["baseUrl"]), timeout=30)
    caption_res.raise_for_status()
    xml = caption_res.text
    if not xml:
        return []

    segments = []
    for start, text in re.findall(r'<text start="([^"]+)"[^>]*>([\s\S]*?)</text>', xml):
        clean_text = re.sub(r"\s+", " ", unescape(text)).strip()
        if clean_text:
            segments.append({"startSeconds": float(start), "text": clean_text})
    return segments


def to_timestamp(seconds: float) -> str:
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes}:{secs:02d}"


def build_transcript(segments: list[dict]) -> str:
    return "\n".join(
        f"{to_timestamp(segment['startSeconds'])} - {segment['text']}" for segment in segments
    )


def normalize_parsed_payload(parsed: object) -> dict:
    if isinstance(parsed, dict):
        return parsed
    if isinstance(parsed, list):
        if len(parsed) == 1 and isinstance(parsed[0], dict):
            return parsed[0]
        raise RuntimeError("Gemini returned a JSON list instead of an object")
    raise RuntimeError(f"Gemini returned {type(parsed).__name__} instead of an object")


def estimate_cost_usd(model: str, usage: dict) -> float:
    prompt_tokens = usage.get("promptTokenCount", 0) or 0
    output_tokens = usage.get("candidatesTokenCount", 0) or 0
    thought_tokens = usage.get("thoughtsTokenCount", 0) or 0
    rates = {
        "gemini-3-flash-preview": {"input": 0.50, "output": 3.00},
        "gemini-3.1-pro-preview": {"input": 2.00, "output": 12.00},
        "gemini-3.1-flash-preview": {"input": 0.25, "output": 1.50},
    }
    rate = rates.get(model)
    if not rate:
        return 0.0
    return round(
        (prompt_tokens / 1_000_000) * rate["input"]
        + ((output_tokens + thought_tokens) / 1_000_000) * rate["output"],
        6,
    )


def build_gen_ai_attributes(model: str, usage: dict, estimated_cost: float) -> dict:
    prompt_tokens = int(usage.get("promptTokenCount", 0) or 0)
    output_tokens = int(usage.get("candidatesTokenCount", 0) or 0)
    cached_tokens = int(usage.get("cachedContentTokenCount", 0) or 0)
    return {
        "gen_ai.system": "google-gemini",
        "gen_ai.request.model": model,
        "gen_ai.usage.input_tokens": prompt_tokens,
        "gen_ai.usage.output_tokens": output_tokens,
        "gen_ai.usage.cache_read_tokens": cached_tokens,
        "gen_ai.usage.cost": estimated_cost,
    }


def call_gemini_json(gemini_api_key: str, model: str, body: dict) -> dict:
    last_error = "Gemini request failed"
    fallback_model = "gemini-3.1-flash-preview"
    model_candidates = [model]
    if model == "gemini-3-flash-preview":
        model_candidates.append(fallback_model)
    attempts = []
    read_timeout_seconds = 360

    for model_index, active_model in enumerate(model_candidates):
        for attempt in range(3):
            started_at = iso_now()
            try:
                res = requests.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{active_model}:generateContent",
                    params={"key": gemini_api_key},
                    json=body,
                    timeout=read_timeout_seconds,
                )
            except requests.exceptions.ReadTimeout:
                finished_at = iso_now()
                last_error = (
                    "Gemini read timed out while waiting for a response "
                    f"after {read_timeout_seconds}s"
                )
                attempts.append({
                    "attemptIndex": attempt + 1,
                    "requestedModel": model,
                    "actualModel": active_model,
                    "isFallback": active_model != model,
                    "startedAt": started_at,
                    "endedAt": finished_at,
                    "statusCode": None,
                    "requestBody": body,
                    "error": last_error,
                    "ok": False,
                })
                if attempt < 2:
                    time.sleep(5 * (attempt + 1))
                    continue
                if model_index < len(model_candidates) - 1:
                    break
                error = RuntimeError(last_error)
                setattr(error, "attempts", attempts)
                raise error
            except requests.exceptions.RequestException as exc:
                finished_at = iso_now()
                last_error = str(exc)
                attempts.append({
                    "attemptIndex": attempt + 1,
                    "requestedModel": model,
                    "actualModel": active_model,
                    "isFallback": active_model != model,
                    "startedAt": started_at,
                    "endedAt": finished_at,
                    "statusCode": None,
                    "requestBody": body,
                    "error": last_error,
                    "ok": False,
                })
                if attempt < 2:
                    time.sleep(3 * (attempt + 1))
                    continue
                if model_index < len(model_candidates) - 1:
                    break
                error = RuntimeError(last_error)
                setattr(error, "attempts", attempts)
                raise error
            try:
                data = res.json()
            except Exception:
                data = {"raw_text": res.text}
            finished_at = iso_now()
            if res.ok:
                parts = (
                    data.get("candidates", [{}])[0]
                    .get("content", {})
                    .get("parts", [])
                )
                candidate_text = "".join(part.get("text", "") for part in parts).strip()
                if not candidate_text:
                    raise RuntimeError("Gemini returned an empty response")

                cleaned = re.sub(r"^```(?:json)?\s*", "", candidate_text, flags=re.I)
                cleaned = re.sub(r"\s*```$", "", cleaned)
                attempts.append({
                    "attemptIndex": attempt + 1,
                    "requestedModel": model,
                    "actualModel": active_model,
                    "isFallback": active_model != model,
                    "startedAt": started_at,
                    "endedAt": finished_at,
                    "statusCode": res.status_code,
                    "requestBody": body,
                    "responseBody": data,
                    "rawText": candidate_text,
                    "ok": True,
                })
                return {
                    "parsed": json.loads(cleaned),
                    "raw_text": candidate_text,
                    "usage": data.get("usageMetadata") or {},
                    "model": active_model,
                    "attempts": attempts,
                }

            last_error = data.get("error", {}).get("message") or f"Gemini request failed ({res.status_code})"
            attempts.append({
                "attemptIndex": attempt + 1,
                "requestedModel": model,
                "actualModel": active_model,
                "isFallback": active_model != model,
                "startedAt": started_at,
                "endedAt": finished_at,
                "statusCode": res.status_code,
                "requestBody": body,
                "responseBody": data,
                "error": last_error,
                "ok": False,
            })
            if "high demand" in last_error.lower():
                if attempt < 2:
                    time.sleep(5 * (attempt + 1))
                    continue
                if model_index < len(model_candidates) - 1:
                    break
            error = RuntimeError(last_error)
            setattr(error, "attempts", attempts)
            raise error

    error = RuntimeError(last_error)
    setattr(error, "attempts", attempts)
    raise error


def send_callback(callback_url: str, callback_secret: str, body: dict) -> None:
    requests.post(
        callback_url,
        headers={
            "Content-Type": "application/json",
            "x-tutorial-callback-secret": callback_secret,
        },
        json={"action": "callback", **body},
        timeout=30,
    ).raise_for_status()


def get_first_available_variable(paths: list[str]) -> str | None:
    for path in paths:
        try:
            value = wmill.get_variable(path)
        except Exception:
            value = None
        if value:
            return value
    return None


def get_langfuse_config() -> tuple[str, str, str] | None:
    public_key = get_first_available_variable([
        "u/bled/langfuse_public_key",
    ])
    secret_key = get_first_available_variable([
        "u/bled/langfuse_secret_key",
    ])
    base_url = get_first_available_variable([
        "u/bled/langfuse_base_url",
    ])
    if not public_key or not secret_key or not base_url:
        return None
    return public_key, secret_key, base_url.rstrip("/")


def get_testycool_runtime_config() -> tuple[str, str] | None:
    base_url = get_first_available_variable([
        "u/bled/testycool_base_url",
    ])
    secret = get_first_available_variable([
        "u/bled/testycool_tutorial_secret",
    ])
    if not base_url or not secret:
        return None
    return base_url.rstrip("/"), secret


def fetch_remote_job_config(job_id: str) -> dict | None:
    config = get_testycool_runtime_config()
    if not config:
        return None
    base_url, secret = config
    res = requests.get(
        f"{base_url}/api/tutorial/generate",
        params={"action": "worker-config", "id": job_id},
        headers={"x-tutorial-callback-secret": secret},
        timeout=30,
    )
    res.raise_for_status()
    data = res.json()
    if not isinstance(data, dict):
        raise RuntimeError("Remote worker config response was invalid")
    data["callbackSecret"] = secret
    return data


def langfuse_ingest(batch: list[dict]):
    config = get_langfuse_config()
    if not config or not batch:
        return
    public_key, secret_key, base_url = config

    payload = {
        "batch": batch
    }
    try:
        requests.post(
            f"{base_url}/api/public/ingestion",
            headers={"Content-Type": "application/json"},
            auth=(public_key, secret_key),
            json=payload,
            timeout=20,
        ).raise_for_status()
    except Exception:
        return


def langfuse_trace(trace_id: str, name: str, input_payload: dict, output_payload: dict, start_time: str, metadata: dict | None = None):
    langfuse_ingest([
        {
            "id": str(uuid.uuid4()),
            "type": "trace-create",
            "timestamp": start_time,
            "body": {
                "id": trace_id,
                "name": name,
                "input": input_payload,
                "output": output_payload,
                "metadata": metadata,
            },
        }
    ])


def langfuse_event(
    trace_id: str,
    name: str,
    timestamp: str,
    input_payload: dict | None = None,
    output_payload: dict | None = None,
    metadata: dict | None = None,
    parent_observation_id: str | None = None,
):
    langfuse_ingest([
        {
            "id": str(uuid.uuid4()),
            "type": "event-create",
            "timestamp": timestamp,
            "body": {
                "id": str(uuid.uuid4()),
                "traceId": trace_id,
                "name": name,
                "input": input_payload,
                "output": output_payload,
                "metadata": metadata,
                "parentObservationId": parent_observation_id,
            },
        }
    ])


def langfuse_span(
    trace_id: str,
    span_id: str,
    name: str,
    start_time: str,
    end_time: str,
    input_payload: dict | None = None,
    output_payload: dict | None = None,
    metadata: dict | None = None,
    parent_observation_id: str | None = None,
):
    langfuse_ingest([
        {
            "id": str(uuid.uuid4()),
            "type": "span-create",
            "timestamp": start_time,
            "body": {
                "id": span_id,
                "traceId": trace_id,
                "name": name,
                "startTime": start_time,
                "endTime": end_time,
                "input": input_payload,
                "output": output_payload,
                "metadata": metadata,
                "parentObservationId": parent_observation_id,
            },
        }
    ])


def langfuse_generation(
    trace_id: str,
    generation_id: str,
    name: str,
    model: str,
    start_time: str,
    end_time: str,
    input_payload: dict | None = None,
    output_payload: dict | None = None,
    metadata: dict | None = None,
    parent_observation_id: str | None = None,
):
    langfuse_ingest([
        {
            "id": str(uuid.uuid4()),
            "type": "generation-create",
            "timestamp": start_time,
            "body": {
                "id": generation_id,
                "traceId": trace_id,
                "name": name,
                "model": model,
                "startTime": start_time,
                "endTime": end_time,
                "input": input_payload,
                "output": output_payload,
                "metadata": metadata,
                "parentObservationId": parent_observation_id,
            },
        }
    ])


def main(
    jobId: str,
    videoId: str,
    callbackUrl: str = "",
    callbackSecret: str = "",
    promptTemplate: str = "",
    customNote: str = "",
    model: str = "gemini-3-flash-preview",
    analysisMode: str = "auto",
):
    if not jobId or not videoId:
        raise ValueError("Missing required job arguments")
    trace_id = f"video-breakdown-{jobId}"
    remote_config = None
    if not promptTemplate and not customNote and not callbackUrl:
        remote_config = fetch_remote_job_config(jobId)
        if remote_config:
            model = remote_config.get("model") or model
            analysisMode = remote_config.get("analysisMode") or analysisMode
            customNote = remote_config.get("customNote") or ""
            promptTemplate = remote_config.get("promptTemplate") or ""
            callbackUrl = remote_config.get("callbackUrl") or ""
            callbackSecret = remote_config.get("callbackSecret") or callbackSecret

    gemini_api_key = get_first_available_variable([
        "u/bled/oana_googleai",
    ])
    if not gemini_api_key:
        raise ValueError("Missing Windmill Google AI secret")

    try:
        start_iso = iso_now()
        video_title = get_video_title(videoId)
        prompt_base = (promptTemplate or build_prompt(video_title)).replace("{videoTitle}", video_title)
        extra_note = f"\n\n## ADDITIONAL INSTRUCTIONS FROM USER\n{customNote.strip()}" if customNote.strip() else ""
        analysis_span_id = f"{trace_id}-analysis"
        langfuse_trace(
            trace_id=trace_id,
            name=f"Video Breakdown / {videoId}",
            input_payload={
                "jobId": jobId,
                "videoId": videoId,
                "videoTitle": video_title,
                "requestedModel": model,
                "callbackUrl": callbackUrl,
                "customNote": "[present]" if customNote else "",
                "promptSource": "remote-config" if remote_config else "direct-args",
            },
            output_payload={"state": "started"},
            start_time=start_iso,
            metadata={"videoId": videoId, "jobId": jobId},
        )

        transcript_started = iso_now()
        segments = get_transcript_segments(videoId)
        transcript = build_transcript(segments)
        transcript_finished = iso_now()
        langfuse_span(
            trace_id=trace_id,
            span_id=f"{trace_id}-transcript",
            name="03. Prepare Source Transcript",
            start_time=transcript_started,
            end_time=transcript_finished,
            output_payload={
                "analysisMode": analysisMode,
                "segmentCount": len(segments),
                "transcriptChars": len(transcript),
                "hasTranscript": bool(transcript),
                "transcriptPreview": clip_text(transcript, 500),
            },
            metadata={"videoId": videoId},
        )

        should_use_transcript = analysisMode == "transcript" or (
            analysisMode == "auto" and len(transcript) > 200
        )
        source_mode = "transcript" if should_use_transcript else "video"
        langfuse_event(
            trace_id=trace_id,
            name="04a. Decide Source Path",
            timestamp=iso_now(),
            input_payload={
                "analysisModeRequested": analysisMode,
                "transcriptChars": len(transcript),
                "segmentCount": len(segments),
            },
            output_payload={
                "sourceModeSelected": source_mode,
                "usedTranscriptThreshold": len(transcript) > 200,
                "reason": (
                    "forced transcript"
                    if analysisMode == "transcript"
                    else "forced video"
                    if analysisMode == "video"
                    else "usable transcript available"
                    if should_use_transcript
                    else "transcript missing or too short"
                ),
            },
            metadata={"videoId": videoId},
            parent_observation_id=analysis_span_id,
        )

        if should_use_transcript:
            gemini_body = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                                "text": f"{prompt_base}{extra_note}\n\n## SOURCE TRANSCRIPT\n{transcript}"
                            }
                        ],
                    }
                ],
                "generationConfig": {"responseMimeType": "application/json"},
            }
            langfuse_event(
                trace_id=trace_id,
                name="04b. Build Gemini Request",
                timestamp=iso_now(),
                input_payload={
                    "sourceMode": source_mode,
                    "promptPreview": clip_text(prompt_base, 1000),
                    "extraNotePreview": clip_text(extra_note, 400),
                    "transcriptChars": len(transcript),
                },
                output_payload={
                    "geminiRequest": gemini_body,
                    "requestSummary": {
                        "containsTranscript": True,
                        "containsVideoFile": False,
                        "responseMimeType": "application/json",
                    },
                },
                metadata={"videoId": videoId},
                parent_observation_id=analysis_span_id,
            )
            generation = call_gemini_json(
                gemini_api_key,
                model,
                gemini_body,
            )
            parsed = normalize_parsed_payload(generation["parsed"])
            active_model = generation.get("model") or model
        else:
            gemini_body = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {
                                "fileData": {
                                    "fileUri": f"https://www.youtube.com/watch?v={videoId}",
                                    "mimeType": "video/mp4",
                                }
                            },
                            {"text": f"{prompt_base}{extra_note}"},
                        ],
                    }
                ],
                "generationConfig": {"responseMimeType": "application/json"},
            }
            langfuse_event(
                trace_id=trace_id,
                name="04b. Build Gemini Request",
                timestamp=iso_now(),
                input_payload={
                    "sourceMode": source_mode,
                    "promptPreview": clip_text(prompt_base, 1000),
                    "extraNotePreview": clip_text(extra_note, 400),
                    "transcriptChars": len(transcript),
                },
                output_payload={
                    "geminiRequest": gemini_body,
                    "requestSummary": {
                        "containsTranscript": False,
                        "containsVideoFile": True,
                        "responseMimeType": "application/json",
                    },
                },
                metadata={"videoId": videoId},
                parent_observation_id=analysis_span_id,
            )
            generation = call_gemini_json(
                gemini_api_key,
                model,
                gemini_body,
            )
            parsed = normalize_parsed_payload(generation["parsed"])
            active_model = generation.get("model") or model
        estimated_cost = estimate_cost_usd(active_model, generation.get("usage") or {})

        for attempt in generation.get("attempts", []):
            usage = generation.get("usage") or {}
            attrs = build_gen_ai_attributes(
                attempt["actualModel"],
                usage if attempt["ok"] else {},
                estimated_cost if attempt["ok"] else 0.0,
            )
            langfuse_generation(
                trace_id=trace_id,
                generation_id=f"{trace_id}-attempt-{attempt['actualModel']}-{attempt['attemptIndex']}",
                name=(
                    "04c. Gemini Attempt"
                    if not attempt["isFallback"]
                    else "04c. Gemini Fallback Attempt"
                ),
                model=attempt["actualModel"],
                start_time=attempt["startedAt"],
                end_time=attempt["endedAt"],
                input_payload=attempt["requestBody"],
                output_payload={
                    "ok": attempt["ok"],
                    "statusCode": attempt["statusCode"],
                    "responseBody": attempt.get("responseBody"),
                    "rawText": attempt.get("rawText"),
                    "error": attempt.get("error"),
                },
                metadata={
                    "attributes": attrs,
                    "videoId": videoId,
                    "requestedModel": attempt["requestedModel"],
                    "actualModel": attempt["actualModel"],
                    "attemptIndex": attempt["attemptIndex"],
                    "isFallback": attempt["isFallback"],
                    "sourceMode": source_mode,
                    "usageMetadata": usage if attempt["ok"] else {},
                    "estimatedCostUsd": estimated_cost if attempt["ok"] else 0.0,
                },
                parent_observation_id=analysis_span_id,
            )

        tutorial = {
            "videoId": videoId,
            "videoTitle": video_title,
            "title": parsed.get("title") or video_title,
            "summary": parsed.get("summary") or "",
            "category": parsed.get("category") or "",
            "transcript": parsed.get("transcript") or transcript,
            "incentiveAnalysis": parsed.get("incentiveAnalysis") or "",
            "channelIncentive": parsed.get("channelIncentive") or "",
            "hypeLevel": parsed.get("hypeLevel") or "",
            "trustLevel": parsed.get("trustLevel") or "",
            "evidenceLevel": parsed.get("evidenceLevel") or "",
            "whoShouldCare": parsed.get("whoShouldCare") or "",
            "whatToDoAboutIt": parsed.get("whatToDoAboutIt") or "",
            "analysisModel": active_model,
            "analysisMode": analysisMode,
            "analysisCostUsd": estimated_cost,
            "usageMetadata": generation.get("usage") or {},
            "steps": parsed.get("steps") or [],
            "generatedAt": int(time.time() * 1000),
        }

        if not tutorial["steps"]:
            raise RuntimeError("Generated tutorial did not contain any steps")

        end_iso = iso_now()
        langfuse_event(
            trace_id=trace_id,
            name="04d. Normalize Result",
            timestamp=end_iso,
            input_payload={
                "parsedSummary": {
                    "title": parsed.get("title"),
                    "category": parsed.get("category"),
                    "stepCount": len(parsed.get("steps") or []),
                    "hypeLevel": parsed.get("hypeLevel"),
                    "trustLevel": parsed.get("trustLevel"),
                    "evidenceLevel": parsed.get("evidenceLevel"),
                },
                "geminiRawTextPreview": clip_text(generation.get("raw_text") or "", 2000),
            },
            output_payload={
                "tutorialSummary": {
                    "title": tutorial["title"],
                    "analysisModel": tutorial["analysisModel"],
                    "analysisMode": tutorial["analysisMode"],
                    "analysisCostUsd": tutorial["analysisCostUsd"],
                    "stepCount": len(tutorial["steps"]),
                },
                "tutorial": tutorial,
            },
            metadata={
                "videoId": videoId,
                "sourceMode": source_mode,
                "requestedModel": model,
                "actualModel": active_model,
                "stepCount": len(tutorial["steps"]),
                "hasCallback": bool(callbackUrl),
            },
            parent_observation_id=analysis_span_id,
        )
        langfuse_span(
            trace_id=trace_id,
            span_id=analysis_span_id,
            name="04. Analyze Source with Gemini",
            start_time=start_iso,
            end_time=end_iso,
            input_payload={
                "analysisModeRequested": analysisMode,
                "sourceModeSelected": source_mode,
                "requestedModel": model,
            },
            output_payload={
                "actualModel": active_model,
                "estimatedCostUsd": estimated_cost,
                "stepCount": len(tutorial["steps"]),
            },
            metadata={"videoId": videoId},
        )

        if callbackUrl:
            if not callbackSecret:
                raise ValueError("Missing callbackSecret for callback mode")
            callback_started = iso_now()
            callback_body = {"jobId": jobId, "success": True, "tutorial": tutorial}
            send_callback(
                callbackUrl,
                callbackSecret,
                callback_body,
            )
            callback_finished = iso_now()
            langfuse_span(
                trace_id=trace_id,
                span_id=f"{trace_id}-callback",
                name="05. Send Callback",
                start_time=callback_started,
                end_time=callback_finished,
                input_payload={"callbackUrl": callbackUrl, "body": callback_body},
                output_payload={"ok": True},
                metadata={"videoId": videoId, "jobId": jobId},
            )
            return {"ok": True, "stepCount": len(tutorial["steps"])}

        return tutorial
    except Exception as exc:
        end_iso = iso_now()
        langfuse_event(
            trace_id=trace_id,
            name="04. Worker Failed",
            timestamp=end_iso,
            input_payload={
                "videoId": videoId,
                "videoTitle": video_title if 'video_title' in locals() else "",
                "sourceMode": source_mode if 'source_mode' in locals() else "",
                "requestedModel": model,
                "geminiRequest": gemini_body if 'gemini_body' in locals() else None,
                "attempts": getattr(exc, "attempts", []),
            },
            output_payload={"error": str(exc)},
            metadata={"videoId": videoId, "failed": True},
        )
        if callbackUrl:
            if not callbackSecret:
                raise ValueError("Missing callbackSecret for callback mode") from exc
            callback_started = iso_now()
            callback_body = {"jobId": jobId, "success": False, "error": str(exc)}
            send_callback(
                callbackUrl,
                callbackSecret,
                callback_body,
            )
            callback_finished = iso_now()
            langfuse_span(
                trace_id=trace_id,
                span_id=f"{trace_id}-callback-failed",
                name="05. Send Failure Callback",
                start_time=callback_started,
                end_time=callback_finished,
                input_payload={"callbackUrl": callbackUrl, "body": callback_body},
                output_payload={"ok": True},
                metadata={"videoId": videoId, "jobId": jobId, "failed": True},
            )
        raise
