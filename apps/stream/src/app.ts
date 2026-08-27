import {
  InputError,
  parseCreatePost,
  parsePostId,
  parseUpdatePost,
  type CreatePostInput,
  type PostStatus,
  type UpdatePostInput,
} from "./domain";

export interface Post {
  id: number;
  body: string;
  tags: string[];
  status: PostStatus;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostStore {
  list(query: string, limit: number): Promise<Post[]>;
  create(input: CreatePostInput): Promise<Post>;
  update(id: number, input: UpdatePostInput): Promise<Post | null>;
  delete(id: number): Promise<boolean>;
}

const apiHeaders: Record<string, string> = {
  "Cache-Control": "no-store",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

class ForbiddenError extends Error {
  override name = "ForbiddenError";
}

function json(value: unknown, status = 200): Response {
  return Response.json(value, {
    status,
    headers: { ...apiHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function empty(status: number): Response {
  return new Response(null, { status, headers: apiHeaders });
}

function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("Origin");
  if (origin !== new URL(request.url).origin) {
    throw new ForbiddenError("Cross-origin writes are not allowed");
  }
}

async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("Content-Type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    throw new InputError("Content-Type must be application/json");
  }

  try {
    return await request.json();
  } catch {
    throw new InputError("Request body must be valid JSON");
  }
}

function listOptions(url: URL): { query: string; limit: number } {
  const query = (url.searchParams.get("q") ?? "").trim();
  if (query.length > 200) throw new InputError("Search can be at most 200 characters");

  const rawLimit = url.searchParams.get("limit");
  const limit = rawLimit === null ? 100 : Number(rawLimit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new InputError("Limit must be an integer from 1 to 100");
  }

  return { query, limit };
}

async function route(request: Request, store: PostStore): Promise<Response> {
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  if (url.pathname === "/api/health") {
    if (method !== "GET") return empty(405);
    return json({ ok: true });
  }

  if (url.pathname === "/api/posts") {
    if (method === "GET") {
      const { query, limit } = listOptions(url);
      return json({ posts: await store.list(query, limit) });
    }

    if (method === "POST") {
      assertSameOrigin(request);
      const post = await store.create(parseCreatePost(await readJson(request)));
      return json(post, 201);
    }

    return empty(405);
  }

  const match = url.pathname.match(/^\/api\/posts\/([^/]+)$/);
  if (match) {
    const id = parsePostId(match[1]);

    if (method === "PATCH") {
      assertSameOrigin(request);
      const post = await store.update(id, parseUpdatePost(await readJson(request)));
      return post ? json(post) : json({ error: "Post not found" }, 404);
    }

    if (method === "DELETE") {
      assertSameOrigin(request);
      return (await store.delete(id)) ? empty(204) : json({ error: "Post not found" }, 404);
    }

    return empty(405);
  }

  return json({ error: "Not found" }, 404);
}

export async function handleApiRequest(request: Request, store: PostStore): Promise<Response> {
  try {
    return await route(request, store);
  } catch (error) {
    if (error instanceof ForbiddenError) return json({ error: error.message }, 403);
    if (error instanceof InputError) return json({ error: error.message }, 400);
    console.error("Stream API error", error);
    return json({ error: "Something went wrong" }, 500);
  }
}
