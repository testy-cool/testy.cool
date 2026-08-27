export const MAX_BODY_LENGTH = 10_000;
export const MAX_TAGS = 8;
export const MAX_TAG_LENGTH = 32;

export type PostStatus = "thought" | "idea";

export class InputError extends Error {
  override name = "InputError";
}

export interface CreatePostInput {
  body: string;
  tags: string[];
  status: PostStatus;
}

export interface UpdatePostInput {
  body?: string;
  tags?: string[];
  status?: PostStatus;
  pinned?: boolean;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new InputError("Request body must be a JSON object");
  }

  return value as Record<string, unknown>;
}

function parseBody(value: unknown): string {
  if (typeof value !== "string") {
    throw new InputError("Thought must be text");
  }

  const body = value.trim();
  if (!body) throw new InputError("Write something first");
  if (body.length > MAX_BODY_LENGTH) {
    throw new InputError(
      `Thoughts can be at most ${MAX_BODY_LENGTH.toLocaleString("en-US")} characters`,
    );
  }

  return body;
}

function parseStatus(value: unknown): PostStatus {
  if (value !== "thought" && value !== "idea") {
    throw new InputError("Status must be thought or idea");
  }

  return value;
}

function normalizeTags(values: unknown[]): string[] {
  const tags = values.map((value) => {
    if (typeof value !== "string") throw new InputError("Tags must be text");
    return value.trim().toLowerCase();
  });

  const unique = [...new Set(tags.filter(Boolean))].sort();
  if (unique.length > MAX_TAGS) throw new InputError(`Use at most ${MAX_TAGS} tags`);
  if (unique.some((tag) => tag.length > MAX_TAG_LENGTH)) {
    throw new InputError(`Tags can be at most ${MAX_TAG_LENGTH} characters`);
  }

  return unique;
}

export function tagsFromInput(value: unknown): string[] {
  if (value === undefined) return [];
  if (typeof value === "string") return normalizeTags(value.split(","));
  if (Array.isArray(value)) return normalizeTags(value);
  throw new InputError("Tags must be a list or comma-separated text");
}

export function parseCreatePost(value: unknown): CreatePostInput {
  const input = asRecord(value);

  return {
    body: parseBody(input.body),
    tags: tagsFromInput(input.tags),
    status: input.status === undefined ? "thought" : parseStatus(input.status),
  };
}

export function parseUpdatePost(value: unknown): UpdatePostInput {
  const input = asRecord(value);
  const update: UpdatePostInput = {};

  if ("body" in input) update.body = parseBody(input.body);
  if ("tags" in input) update.tags = tagsFromInput(input.tags);
  if ("status" in input) update.status = parseStatus(input.status);
  if ("pinned" in input) {
    if (typeof input.pinned !== "boolean") {
      throw new InputError("Pinned must be true or false");
    }
    update.pinned = input.pinned;
  }

  if (Object.keys(update).length === 0) throw new InputError("No changes provided");
  return update;
}

export function parsePostId(value: string): number {
  if (!/^\d+$/.test(value)) throw new InputError("Invalid post id");
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) throw new InputError("Invalid post id");
  return id;
}
