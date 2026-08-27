import { handleApiRequest } from "./app";
import { D1PostStore } from "./d1-store";

export interface Env {
  DB: D1Database;
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export function routeWorkerRequest(request: Request, env: Env): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return handleApiRequest(request, new D1PostStore(env.DB));
  }

  return env.ASSETS.fetch(request);
}

export default {
  fetch(request, env) {
    return routeWorkerRequest(request, env);
  },
} satisfies ExportedHandler<Env>;
