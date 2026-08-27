import { beforeEach, describe, expect, it } from "vitest";

import { handleApiRequest, type Post, type PostStore } from "./app";
import type { CreatePostInput, UpdatePostInput } from "./domain";

class MemoryPostStore implements PostStore {
  posts: Post[] = [];
  nextId = 1;

  async list(query: string, limit: number): Promise<Post[]> {
    const needle = query.toLowerCase();
    return this.posts
      .filter((post) => `${post.body} ${post.tags.join(" ")}`.toLowerCase().includes(needle))
      .sort((left, right) => Number(right.pinned) - Number(left.pinned) || right.id - left.id)
      .slice(0, limit);
  }

  async create(input: CreatePostInput): Promise<Post> {
    const now = new Date().toISOString();
    const post: Post = {
      id: this.nextId++,
      ...input,
      pinned: false,
      createdAt: now,
      updatedAt: now,
    };
    this.posts.push(post);
    return post;
  }

  async update(id: number, input: UpdatePostInput): Promise<Post | null> {
    const post = this.posts.find((candidate) => candidate.id === id);
    if (!post) return null;
    Object.assign(post, input, { updatedAt: new Date().toISOString() });
    return post;
  }

  async delete(id: number): Promise<boolean> {
    const before = this.posts.length;
    this.posts = this.posts.filter((post) => post.id !== id);
    return this.posts.length !== before;
  }
}

const request = (path: string, init?: RequestInit) =>
  new Request(`https://stream.testy.cool${path}`, init);

describe("Stream API", () => {
  let store: MemoryPostStore;

  beforeEach(() => {
    store = new MemoryPostStore();
  });

  it("returns a no-store health response with security headers", async () => {
    const response = await handleApiRequest(request("/api/health"), store);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-security-policy")).toContain("default-src 'none'");
    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
  });

  it("creates and lists a thought", async () => {
    const createResponse = await handleApiRequest(
      request("/api/posts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://stream.testy.cool",
        },
        body: JSON.stringify({ body: "  A useful thought. ", tags: "LLMs, notes" }),
      }),
      store,
    );

    expect(createResponse.status).toBe(201);
    expect(await createResponse.json()).toMatchObject({
      body: "A useful thought.",
      tags: ["llms", "notes"],
      status: "thought",
    });

    const listResponse = await handleApiRequest(request("/api/posts?q=useful"), store);
    const list = (await listResponse.json()) as { posts: Post[] };
    expect(list.posts).toHaveLength(1);
  });

  it("blocks cross-origin writes", async () => {
    const response = await handleApiRequest(
      request("/api/posts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://example.com",
        },
        body: JSON.stringify({ body: "Do not save this" }),
      }),
      store,
    );

    expect(response.status).toBe(403);
    expect(store.posts).toHaveLength(0);
  });

  it("updates and deletes a post", async () => {
    const post = await store.create({ body: "Draft", tags: [], status: "thought" });
    const updateResponse = await handleApiRequest(
      request(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          origin: "https://stream.testy.cool",
        },
        body: JSON.stringify({ body: "Better draft", pinned: true, status: "idea" }),
      }),
      store,
    );
    expect(await updateResponse.json()).toMatchObject({
      body: "Better draft",
      pinned: true,
      status: "idea",
    });

    const deleteResponse = await handleApiRequest(
      request(`/api/posts/${post.id}`, {
        method: "DELETE",
        headers: { origin: "https://stream.testy.cool" },
      }),
      store,
    );
    expect(deleteResponse.status).toBe(204);
    expect(store.posts).toHaveLength(0);
  });

  it("returns useful client errors", async () => {
    const response = await handleApiRequest(
      request("/api/posts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://stream.testy.cool",
        },
        body: JSON.stringify({ body: " " }),
      }),
      store,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "Write something first" });
  });
});
