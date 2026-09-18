import { describe, expect, it, vi } from "vitest";

import { routeWorkerRequest, type Env } from "./index";

describe("Stream worker", () => {
  it("serves the private UI through the assets binding", async () => {
    const fetch = vi.fn(async () => new Response("stream-ui"));
    const env = { ASSETS: { fetch }, DB: {} as D1Database } as Env;
    const request = new Request("https://stream.testy.cool/");

    const response = await routeWorkerRequest(request, env);

    expect(await response.text()).toBe("stream-ui");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("content-security-policy")).toContain(
      "script-src 'self'",
    );
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(fetch).toHaveBeenCalledWith(request);
  });

  it("keeps unknown API routes out of static assets", async () => {
    const fetch = vi.fn(async () => new Response("asset fallback"));
    const env = { ASSETS: { fetch }, DB: {} as D1Database } as Env;

    const response = await routeWorkerRequest(
      new Request("https://stream.testy.cool/api/unknown"),
      env,
    );

    expect(response.status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });
});
