import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { convertV4MiniflareOptions, Miniflare } from "miniflare";

import { D1PostStore } from "./d1-store";

const schema = `
  CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    body TEXT NOT NULL,
    tags TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'thought' CHECK (status IN ('thought', 'idea')),
    pinned INTEGER NOT NULL DEFAULT 0 CHECK (pinned IN (0, 1)),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

describe("D1PostStore", () => {
  let miniflare: Miniflare;
  let store: D1PostStore;

  beforeEach(async () => {
    miniflare = new Miniflare(
      convertV4MiniflareOptions({
        compatibilityDate: "2026-08-27",
        modules: true,
        script: "export default { fetch() { return new Response('ok') } }",
        d1Databases: { DB: "stream-test" },
      }),
    );
    const database = await miniflare.getD1Database("DB");
    await database.prepare(schema).run();
    store = new D1PostStore(database as unknown as D1Database);
  });

  afterEach(async () => {
    await miniflare.dispose();
  });

  it("persists, searches, and sorts posts", async () => {
    const first = await store.create({
      body: "A note about agents",
      tags: ["agents"],
      status: "thought",
    });
    const second = await store.create({
      body: "Try the smaller model",
      tags: ["models"],
      status: "idea",
    });
    await store.update(first.id, { pinned: true });

    expect(await store.list("", 100)).toMatchObject([
      { id: first.id, pinned: true },
      { id: second.id, pinned: false },
    ]);
    expect(await store.list("models", 100)).toMatchObject([{ id: second.id }]);
  });

  it("updates and deletes existing posts", async () => {
    const post = await store.create({
      body: "Draft",
      tags: [],
      status: "thought",
    });

    expect(
      await store.update(post.id, { body: "Edited", tags: ["notes"] }),
    ).toMatchObject({
      body: "Edited",
      tags: ["notes"],
    });
    expect(await store.delete(post.id)).toBe(true);
    expect(await store.delete(post.id)).toBe(false);
    expect(await store.update(post.id, { pinned: true })).toBeNull();
  });
});
