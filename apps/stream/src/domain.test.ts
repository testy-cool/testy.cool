import { describe, expect, it } from "vitest";

import {
  parseCreatePost,
  parsePostId,
  parseUpdatePost,
  tagsFromInput,
} from "./domain";

describe("parseCreatePost", () => {
  it("trims a thought and normalizes its tags", () => {
    expect(
      parseCreatePost({
        body: "  Keep the useful rough edges.  ",
        tags: [" Design ", "ideas", "design", ""],
        status: "idea",
      }),
    ).toEqual({
      body: "Keep the useful rough edges.",
      tags: ["design", "ideas"],
      status: "idea",
    });
  });

  it("rejects an empty thought", () => {
    expect(() => parseCreatePost({ body: "   " })).toThrow(
      "Write something first",
    );
  });

  it("rejects a thought over 10,000 characters", () => {
    expect(() => parseCreatePost({ body: "x".repeat(10_001) })).toThrow(
      "Thoughts can be at most 10,000 characters",
    );
  });

  it("rejects unknown statuses", () => {
    expect(() =>
      parseCreatePost({ body: "Hello", status: "published" }),
    ).toThrow("Status must be thought or idea");
  });
});

describe("parseUpdatePost", () => {
  it("accepts a pin-only update", () => {
    expect(parseUpdatePost({ pinned: true })).toEqual({ pinned: true });
  });

  it("rejects updates without editable fields", () => {
    expect(() => parseUpdatePost({ ignored: true })).toThrow(
      "No changes provided",
    );
  });
});

describe("tagsFromInput", () => {
  it("parses comma-separated tags", () => {
    expect(tagsFromInput(" agents, LLMs, agents ")).toEqual(["agents", "llms"]);
  });
});

describe("parsePostId", () => {
  it("accepts positive integer ids", () => {
    expect(parsePostId("42")).toBe(42);
  });

  it.each(["0", "-1", "2.5", "hello"])("rejects %s", (value) => {
    expect(() => parsePostId(value)).toThrow("Invalid post id");
  });
});
