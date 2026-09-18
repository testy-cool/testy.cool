import { describe, expect, it } from "vitest";

// @ts-expect-error The browser asset is plain JavaScript by design.
import { escapeHtml, postMarkup, tagsFromField } from "../public/app.js";

describe("Stream UI rendering", () => {
  it("escapes saved text before rendering it", () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)">`)).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });

  it("renders post state without executable user markup", () => {
    const markup = postMarkup({
      id: 7,
      body: "Line one\n<script>alert(1)</script>",
      tags: ["notes", `<img src=x>`],
      status: "idea",
      pinned: true,
      createdAt: "2026-08-27T16:00:00.000Z",
      updatedAt: "2026-08-27T16:00:00.000Z",
    });

    expect(markup).toContain(
      "Line one<br>&lt;script&gt;alert(1)&lt;/script&gt;",
    );
    expect(markup).toContain("Pinned");
    expect(markup).toContain("Idea");
    expect(markup).not.toContain("<script>");
    expect(markup).not.toContain("<img");
  });

  it("normalizes tags entered in the composer", () => {
    expect(tagsFromField(" Agents, llms, agents ")).toEqual(["agents", "llms"]);
  });
});
