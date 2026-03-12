#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const NOTE_STATUSES = new Set(["draft", "published", "evergreen", "archived"]);
const NOTE_CONFIDENCE = new Set(["low", "medium", "high"]);
const NOTE_RESUME_SIGNALS = new Set(["none", "supporting", "featured"]);

const FIELD_ORDER = [
  "title",
  "description",
  "date",
  "updated",
  "author",
  "id",
  "status",
  "confidence",
  "resumeSignal",
  "canonical",
  "supersedes",
  "draft",
  "tags",
  "image",
  "series",
  "seriesPart",
];

const DEFAULT_AUTHOR = "testy.cool";
const DEFAULT_DRAFT_DESCRIPTION = "Working note captured from a coding session.";

const scriptFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFile);
const webRoot = path.resolve(scriptDir, "..");
const contentRoot = path.join(webRoot, "content", "blog");

async function main() {
  const { positionals, flags } = parseArgs(process.argv.slice(2));
  const action = positionals[0] ?? "help";

  if (flags.help || action === "help") {
    printHelp();
    return;
  }

  try {
    if (action === "capture") {
      await handleCapture(flags);
      return;
    }

    if (action === "revise") {
      await handleRevise(flags);
      return;
    }

    if (action === "promote") {
      await handlePromote(flags);
      return;
    }

    throw new Error(`Unknown action "${action}". Use capture, revise, or promote.`);
  } catch (error) {
    console.error(`notes-operator: ${error.message}`);
    process.exitCode = 1;
  }
}

function printHelp() {
  const lines = [
    "Notes operator",
    "",
    "Usage:",
    "  pnpm note:capture -- --title \"What I learned\" [options]",
    "  pnpm note:revise -- --id note-id [options]",
    "  pnpm note:promote -- --id note-id [options]",
    "",
    "Common options:",
    "  --id <value>",
    "  --title <value>",
    "  --description <value>",
    "  --category <slug>",
    "  --slug <slug>",
    "  --tags <comma,separated>",
    "  --body <text>",
    "  --body-file <path>",
    "  --append <text>",
    "  --append-file <path>",
    "  --prepend <text>",
    "  --prepend-file <path>",
    "  --status <draft|published|evergreen|archived>",
    "  --confidence <low|medium|high>",
    "  --resume-signal <none|supporting|featured>",
    "  --canonical <url-or-path>",
    "  --supersedes <comma,separated>",
    "  --series <value>",
    "  --series-part <number>",
    "  --touch-updated",
    "  --dry-run",
    "",
    "Notes:",
    "  - capture creates a new note by default in lab-notes as a draft.",
    "  - revise updates an existing note by stable id and touches updated by default.",
    "  - promote removes draft mode and can move a note to a new category or slug.",
  ];

  console.log(lines.join("\n"));
}

async function handleCapture(flags) {
  const notes = await loadNotes();
  const explicitId = flags.id ? normalizeId(flags.id) : null;
  const existing = explicitId ? findNoteById(notes, explicitId) : null;

  if (existing) {
    const result = await reviseExistingNote(existing, flags, {
      action: "capture",
      defaultTouchUpdated: false,
    });
    await persistResult(result, flags);
    return;
  }

  const title = requireString(flags.title, "capture requires --title when creating a new note.");
  const category = normalizeCategory(flags.category ?? "lab-notes");
  const slug = normalizeSlug(flags.slug ?? explicitId ?? title);
  const noteId = explicitId ?? slug;
  const targetPath = buildNotePath(category, slug);

  if (notes.some((note) => note.path === targetPath)) {
    throw new Error(`Target file already exists: ${relativeToRepo(targetPath)}`);
  }

  const body = await resolveBody(flags, () => buildBodyTemplate(category));
  const status = normalizeStatus(flags.status ?? "draft");
  const draft =
    typeof flags.draft === "boolean" ? flags.draft : status === "draft";
  const description =
    flags.description ??
    (status === "draft" ? DEFAULT_DRAFT_DESCRIPTION : null);

  if (!description) {
    throw new Error("Published notes require --description.");
  }

  const data = cleanupNoteData({
    title,
    description,
    date: normalizeDate(flags.date ?? todayString()),
    updated: flags.updated ? normalizeDate(flags.updated) : undefined,
    author: flags.author ?? DEFAULT_AUTHOR,
    id: noteId,
    status,
    confidence: flags.confidence
      ? normalizeConfidence(flags.confidence)
      : undefined,
    resumeSignal: flags["resume-signal"]
      ? normalizeResumeSignal(flags["resume-signal"])
      : undefined,
    canonical: flags.canonical,
    supersedes: parseList(flags.supersedes),
    draft,
    tags: parseList(flags.tags),
    image: flags.image,
    series: flags.series,
    seriesPart: parseOptionalInteger(flags["series-part"], "series-part"),
  });

  await persistResult(
    {
      summary: `Create ${relativeToRepo(targetPath)}`,
      targetPath,
      previousPath: null,
      data,
      body,
      changed: true,
      warnings: buildPromotionWarnings(data),
    },
    flags,
  );
}

async function handleRevise(flags) {
  const note = await requireExistingNote(flags.id);
  const result = await reviseExistingNote(note, flags, {
    action: "revise",
    defaultTouchUpdated: true,
  });
  await persistResult(result, flags);
}

async function handlePromote(flags) {
  const note = await requireExistingNote(flags.id);
  const promoteFlags = {
    ...flags,
    status: flags.status ?? "published",
    draft: false,
  };
  const result = await reviseExistingNote(note, promoteFlags, {
    action: "promote",
    defaultTouchUpdated: false,
  });
  result.warnings = buildPromotionWarnings(result.data);
  await persistResult(result, flags);
}

async function reviseExistingNote(note, flags, options) {
  if (flags.id && normalizeId(flags.id) !== note.data.id) {
    throw new Error("revise/promote cannot change note id.");
  }

  if (flags.date) {
    throw new Error("revise/promote preserves the original date. Omit --date.");
  }

  const nextData = { ...note.data };
  let nextBody = note.body;
  let bodyChanged = false;
  let pathChanged = false;
  let targetCategory = note.category;
  let targetSlug = note.slug;

  if (flags.title) nextData.title = flags.title;
  if (flags.description) nextData.description = flags.description;
  if (flags.author) nextData.author = flags.author;
  if (flags.status) nextData.status = normalizeStatus(flags.status);
  if (flags.confidence) {
    nextData.confidence = normalizeConfidence(flags.confidence);
  }
  if (flags["resume-signal"]) {
    nextData.resumeSignal = normalizeResumeSignal(flags["resume-signal"]);
  }
  if (flags.canonical) nextData.canonical = flags.canonical;
  if (flags.supersedes) nextData.supersedes = parseList(flags.supersedes);
  if (flags.tags) nextData.tags = parseList(flags.tags);
  if (flags.image) nextData.image = flags.image;
  if (flags.series) nextData.series = flags.series;
  if (flags["series-part"] !== undefined) {
    nextData.seriesPart = parseOptionalInteger(flags["series-part"], "series-part");
  }

  if (flags.category) {
    targetCategory = normalizeCategory(flags.category);
    pathChanged = targetCategory !== note.category || pathChanged;
  }

  if (flags.slug) {
    targetSlug = normalizeSlug(flags.slug);
    pathChanged = targetSlug !== note.slug || pathChanged;
  }

  if (flags.status) {
    const isDraftStatus = nextData.status === "draft";

    if (typeof flags.draft === "boolean") {
      nextData.draft = flags.draft;
    } else {
      nextData.draft = isDraftStatus;
    }
  } else if (typeof flags.draft === "boolean") {
    nextData.draft = flags.draft;
  }

  const replacementBody = await resolveReplacementBody(flags);
  const appendText = await resolveTextInput(flags, "append", "append-file");
  const prependText = await resolveTextInput(flags, "prepend", "prepend-file");

  if (replacementBody !== null) {
    nextBody = replacementBody;
    bodyChanged = nextBody !== note.body;
  } else if (appendText !== null) {
    nextBody = appendToBody(note.body, appendText);
    bodyChanged = true;
  } else if (prependText !== null) {
    nextBody = prependToBody(note.body, prependText);
    bodyChanged = true;
  }

  const metadataChanged =
    serializeComparableData(cleanupNoteData(note.data)) !==
    serializeComparableData(cleanupNoteData(nextData));

  const targetPath = buildNotePath(targetCategory, targetSlug);

  if (targetPath !== note.path) {
    pathChanged = true;
  }

  if (pathChanged) {
    const existingPathOwner = await findNoteByPath(targetPath);
    if (existingPathOwner && existingPathOwner.data.id !== note.data.id) {
      throw new Error(`Target file already exists: ${relativeToRepo(targetPath)}`);
    }
  }

  const changed = metadataChanged || bodyChanged || pathChanged;

  if (changed) {
    if (flags.updated) {
      nextData.updated = normalizeDate(flags.updated);
    } else if (flags["touch-updated"] || options.defaultTouchUpdated) {
      nextData.updated = todayString();
    }
  }

  const cleanedData = cleanupNoteData(nextData);
  const summaryPrefix =
    options.action === "promote" ? "Promote" : options.action === "capture" ? "Update" : "Revise";

  return {
    summary: `${summaryPrefix} ${cleanedData.id} -> ${relativeToRepo(targetPath)}`,
    targetPath,
    previousPath: note.path,
    data: cleanedData,
    body: nextBody,
    changed,
    warnings: [],
  };
}

async function persistResult(result, flags) {
  if (!result.changed) {
    console.log(`${result.summary} (no changes)`);
    return;
  }

  if (flags["dry-run"]) {
    console.log(`${result.summary} [dry-run]`);
    for (const warning of result.warnings) {
      console.log(`warning: ${warning}`);
    }
    return;
  }

  await fs.mkdir(path.dirname(result.targetPath), { recursive: true });
  await fs.writeFile(
    result.targetPath,
    renderNote(result.data, result.body),
    "utf8",
  );

  if (result.previousPath && result.previousPath !== result.targetPath) {
    await fs.unlink(result.previousPath);
    await removeEmptyDirs(path.dirname(result.previousPath));
  }

  console.log(result.summary);
  for (const warning of result.warnings) {
    console.log(`warning: ${warning}`);
  }
}

async function requireExistingNote(id) {
  const noteId = requireString(id, "This action requires --id.");
  const notes = await loadNotes();
  const note = findNoteById(notes, normalizeId(noteId));

  if (!note) {
    throw new Error(`No note found for id "${noteId}".`);
  }

  return note;
}

async function findNoteByPath(targetPath) {
  const notes = await loadNotes();
  return notes.find((note) => note.path === targetPath) ?? null;
}

function buildPromotionWarnings(data) {
  const warnings = [];

  if (!data.description || data.description === DEFAULT_DRAFT_DESCRIPTION) {
    warnings.push("description still looks like a draft placeholder");
  }

  if (!Array.isArray(data.tags) || data.tags.length === 0) {
    warnings.push("tags are empty");
  }

  return warnings;
}

function cleanupNoteData(data) {
  const cleaned = { ...data };

  for (const [key, value] of Object.entries(cleaned)) {
    if (value === undefined || value === null || value === "") {
      delete cleaned[key];
      continue;
    }

    if (Array.isArray(value) && value.length === 0) {
      delete cleaned[key];
    }
  }

  if (cleaned.draft === false) {
    delete cleaned.draft;
  }

  return cleaned;
}

function renderNote(data, body) {
  const keys = [
    ...FIELD_ORDER.filter((key) => key in data),
    ...Object.keys(data).filter((key) => !FIELD_ORDER.includes(key)),
  ];

  const frontmatter = [
    "---",
    ...keys.map((key) => `${key}: ${formatValue(key, data[key])}`),
    "---",
    "",
  ].join("\n");

  const normalizedBody = body.trimEnd();

  return normalizedBody ? `${frontmatter}${normalizedBody}\n` : frontmatter;
}

function formatValue(key, value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => formatInlineString(String(item))).join(", ")}]`;
  }

  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }

  if (key === "date" || key === "updated" || key === "id" || key === "status") {
    return String(value);
  }

  return formatInlineString(String(value));
}

function formatInlineString(value) {
  if (needsQuotes(value)) {
    return JSON.stringify(value);
  }

  return value;
}

function needsQuotes(value) {
  return (
    value.length === 0 ||
    value.trim() !== value ||
    value.includes("\n") ||
    /[:#[\]{}>|"%`\\]/.test(value) ||
    /^[!&*@?|>\-]/.test(value)
  );
}

async function loadNotes() {
  const filePaths = await collectNoteFiles(contentRoot);
  const notes = [];

  for (const filePath of filePaths) {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = parseNote(raw);
    const relativePath = path.relative(contentRoot, filePath).replace(/\\/g, "/");
    const segments = relativePath.split("/");
    const category = segments[0];
    const slug = path.basename(filePath, ".mdx");
    const data = cleanupNoteData(parsed.data);

    if (!data.id) {
      data.id = slug;
    }

    notes.push({
      path: filePath,
      relativePath,
      category,
      slug,
      body: parsed.body,
      data,
    });
  }

  return notes;
}

async function collectNoteFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  });

  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectNoteFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".mdx")) {
      files.push(entryPath);
    }
  }

  return files;
}

function parseNote(rawContent) {
  const content = rawContent.replace(/^\uFEFF/, "");
  const lines = content.split(/\r?\n/);

  if (lines[0] !== "---") {
    throw new Error("Expected frontmatter starting with ---");
  }

  const endIndex = lines.indexOf("---", 1);

  if (endIndex === -1) {
    throw new Error("Expected frontmatter closing ---");
  }

  const data = {};

  for (const line of lines.slice(1, endIndex)) {
    if (!line.trim()) continue;

    const separatorIndex = line.indexOf(":");

    if (separatorIndex === -1) {
      throw new Error(`Invalid frontmatter line: ${line}`);
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    data[key] = parseValue(value);
  }

  return {
    data,
    body: lines.slice(endIndex + 1).join("\n").replace(/^\n/, ""),
  };
}

function parseValue(rawValue) {
  if (rawValue === "true") return true;
  if (rawValue === "false") return false;
  if (/^-?\d+$/.test(rawValue)) return Number(rawValue);

  if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
    return splitInlineList(rawValue.slice(1, -1)).map((item) => parseString(item));
  }

  return parseString(rawValue);
}

function parseString(rawValue) {
  const value = rawValue.trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).replace(/\\"/g, '"');
  }

  return value;
}

function splitInlineList(value) {
  const items = [];
  let buffer = "";
  let quote = null;

  for (const character of value) {
    if ((character === '"' || character === "'") && quote === null) {
      quote = character;
      buffer += character;
      continue;
    }

    if (character === quote) {
      quote = null;
      buffer += character;
      continue;
    }

    if (character === "," && quote === null) {
      items.push(buffer.trim());
      buffer = "";
      continue;
    }

    buffer += character;
  }

  if (buffer.trim()) {
    items.push(buffer.trim());
  }

  return items.filter(Boolean);
}

async function resolveBody(flags, fallbackBuilder) {
  const replacementBody = await resolveReplacementBody(flags);

  if (replacementBody !== null) {
    return replacementBody;
  }

  return fallbackBuilder();
}

async function resolveReplacementBody(flags) {
  return resolveTextInput(flags, "body", "body-file");
}

async function resolveTextInput(flags, key, fileKey) {
  const inlineValue = flags[key];
  const fileValue = flags[fileKey];

  if (inlineValue && fileValue) {
    throw new Error(`Use either --${key} or --${fileKey}, not both.`);
  }

  if (inlineValue) {
    return decodeCliText(String(inlineValue));
  }

  if (fileValue) {
    const filePath = path.resolve(process.cwd(), String(fileValue));
    return fs.readFile(filePath, "utf8");
  }

  return null;
}

function appendToBody(currentBody, appendText) {
  const base = currentBody.trimEnd();
  const extra = appendText.trim();

  if (!base) return `${extra}\n`;
  return `${base}\n\n${extra}\n`;
}

function prependToBody(currentBody, prependText) {
  const base = currentBody.trim();
  const extra = prependText.trim();

  if (!base) return `${extra}\n`;
  return `${extra}\n\n${base}\n`;
}

function buildBodyTemplate(category) {
  if (category === "tutorial") {
    return [
      "Brief intro.",
      "",
      "## The Tool",
      "",
      "## Why This Matters",
      "",
      "## Building Up From Zero",
      "",
      "## Common Pitfalls",
      "",
      "## Quick Reference",
      "",
    ].join("\n");
  }

  if (category === "troubleshooting") {
    return [
      "Short summary of the problem.",
      "",
      "## Problem",
      "",
      "## Fix",
      "",
      "## Notes",
      "",
    ].join("\n");
  }

  return [
    "Brief note captured from a coding session.",
    "",
    "## Context",
    "",
    "## What I Tried",
    "",
    "## What Happened",
    "",
    "## Current Takeaway",
    "",
    "## Next Thing to Try",
    "",
  ].join("\n");
}

function buildNotePath(category, slug) {
  return path.join(contentRoot, category, `${slug}.mdx`);
}

function relativeToRepo(filePath) {
  return path.relative(process.cwd(), filePath).replace(/\\/g, "/");
}

async function removeEmptyDirs(directory) {
  if (directory === contentRoot) return;

  const entries = await fs.readdir(directory).catch(() => null);

  if (entries && entries.length === 0) {
    await fs.rmdir(directory);
    await removeEmptyDirs(path.dirname(directory));
  }
}

function serializeComparableData(data) {
  return JSON.stringify(
    Object.keys(data)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = data[key];
        return accumulator;
      }, {}),
  );
}

function findNoteById(notes, id) {
  return notes.find((note) => normalizeId(note.data.id ?? note.slug) === id) ?? null;
}

function parseArgs(argv) {
  const positionals = [];
  const flags = {};

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (!argument.startsWith("--")) {
      positionals.push(argument);
      continue;
    }

    const key = argument.slice(2);

    if (!key) continue;

    if (key.startsWith("no-")) {
      flags[key.slice(3)] = false;
      continue;
    }

    const nextArgument = argv[index + 1];

    if (!nextArgument || nextArgument.startsWith("--")) {
      flags[key] = true;
      continue;
    }

    flags[key] = nextArgument;
    index += 1;
  }

  return { positionals, flags };
}

function requireString(value, message) {
  if (!value || !String(value).trim()) {
    throw new Error(message);
  }

  return String(value).trim();
}

function normalizeId(value) {
  return normalizeSlug(value);
}

function normalizeCategory(value) {
  return normalizeSlug(value);
}

function normalizeSlug(value) {
  const normalized = String(value)
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");

  if (!normalized) {
    throw new Error(`Could not derive a slug from "${value}".`);
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    throw new Error(`Invalid slug "${normalized}".`);
  }

  return normalized;
}

function normalizeStatus(value) {
  const normalized = String(value).trim();

  if (!NOTE_STATUSES.has(normalized)) {
    throw new Error(`Invalid status "${value}".`);
  }

  return normalized;
}

function normalizeConfidence(value) {
  const normalized = String(value).trim();

  if (!NOTE_CONFIDENCE.has(normalized)) {
    throw new Error(`Invalid confidence "${value}".`);
  }

  return normalized;
}

function normalizeResumeSignal(value) {
  const normalized = String(value).trim();

  if (!NOTE_RESUME_SIGNALS.has(normalized)) {
    throw new Error(`Invalid resume signal "${value}".`);
  }

  return normalized;
}

function parseList(value) {
  if (!value) return undefined;

  const rawValue = String(value).trim();
  const separator = rawValue.includes(",") ? "," : /\s+/;
  const items = rawValue
    .split(separator)
    .map((item) => item.trim())
    .filter(Boolean);

  return items.length > 0 ? items : undefined;
}

function decodeCliText(value) {
  return value
    .replace(/\\+n/g, "\n")
    .replace(/\\+t/g, "\t")
    .replace(/\\+r/g, "\r");
}

function parseOptionalInteger(value, label) {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (!/^-?\d+$/.test(String(value))) {
    throw new Error(`--${label} must be an integer.`);
  }

  return Number(value);
}

function normalizeDate(value) {
  const normalized = String(value).trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`Invalid date "${value}". Use YYYY-MM-DD.`);
  }

  return normalized;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

await main();
