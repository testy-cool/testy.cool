import { handleApiRequest } from "./app";
import { D1PostStore } from "./d1-store";

export interface Env {
  DB: D1Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

const uiSecurityHeaders: Record<string, string> = {
  "Cache-Control": "no-store",
  "Content-Security-Policy":
    "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=()",
  "Referrer-Policy": "no-referrer",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
};

async function secureAssetResponse(request: Request, env: Env): Promise<Response> {
  const response = await env.ASSETS.fetch(request);
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(uiSecurityHeaders)) headers.set(name, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export function routeWorkerRequest(request: Request, env: Env): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return handleApiRequest(request, new D1PostStore(env.DB));
  }

  return secureAssetResponse(request, env);
}

export default {
  fetch(request, env) {
    return routeWorkerRequest(request, env);
  },
} satisfies ExportedHandler<Env>;
