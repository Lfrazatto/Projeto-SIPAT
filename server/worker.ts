import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { D1Database, R2Bucket } from "@cloudflare/workers-types";
import { appRouter } from "./routers";
import { createWorkerContext } from "./_core/workerContext";
import { configureWorkerDatabase, ensureInitialSeeds } from "./db";
import { configureRuntimeEnv } from "./_core/env";

export interface WorkerEnv {
  ASSETS: { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> };
  DB?: D1Database;
  ASSET_BUCKET?: R2Bucket;
  HYPERDRIVE?: { host: string; user: string; password: string; database: string; port: number };
  BACKEND_ORIGIN?: string;
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  ADMIN_ACCESS_KEY?: string;
  VITE_APP_ID?: string;
  OAUTH_SERVER_URL?: string;
  OWNER_OPEN_ID?: string;
  BUILT_IN_FORGE_API_URL?: string;
  BUILT_IN_FORGE_API_KEY?: string;
}

let seedsStarted = false;

function isBackendRequest(pathname: string) {
  return pathname.startsWith("/api/") || pathname.startsWith("/manus-storage/");
}

async function proxyToBackend(request: Request, origin: string) {
  const incoming = new URL(request.url);
  const target = new URL(`${incoming.pathname}${incoming.search}`, origin.replace(/\/+$/, "/"));
  const headers = new Headers(request.headers);
  headers.set("x-forwarded-host", incoming.host);
  headers.set("x-forwarded-proto", incoming.protocol.replace(":", ""));
  headers.delete("host");

  const proxiedRequest = new Request(target, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  });
  const response = await fetch(proxiedRequest);
  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-length");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders });
}

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", headers.get("origin") ?? "*");
  headers.set("access-control-allow-credentials", "true");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function serveAssets(request: Request, assets: WorkerEnv["ASSETS"]) {
  const url = new URL(request.url);
  const isExtensionlessRoute = !url.pathname.includes(".");
  if (isExtensionlessRoute && url.pathname !== "/") {
    return assets.fetch(new Request(new URL("/index.html", request.url), { method: "GET", headers: request.headers }) as never);
  }
  try {
    const response = await assets.fetch(request as never);
    if (response.status !== 404) return response;
  } catch {
    // Some temporary Workers asset bindings throw 1101 for extensionless SPA routes.
  }
  const fallback = new URL("/index.html", request.url);
  return assets.fetch(new Request(fallback, { headers: request.headers }) as never);
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    configureRuntimeEnv(env);
    configureWorkerDatabase(env);
    if (!seedsStarted && !env.BACKEND_ORIGIN) {
      seedsStarted = true;
      void ensureInitialSeeds().catch((error) => console.error("[Worker] seed failed", error));
    }

    const url = new URL(request.url);
    if (env.ASSET_BUCKET && url.pathname.startsWith("/assets/")) {
      const key = url.pathname.slice("/assets/".length);
      const object = await env.ASSET_BUCKET.get(key);
      if (!object) return new Response("Not Found", { status: 404 });
      const headers = new Headers();
      object.writeHttpMetadata(headers as any);
      headers.set("etag", object.httpEtag);
      headers.set("cache-control", "public, max-age=31536000, immutable");
      return new Response(object.body as unknown as BodyInit, { headers });
    }
    if (env.BACKEND_ORIGIN && isBackendRequest(url.pathname)) {
      return proxyToBackend(request, env.BACKEND_ORIGIN);
    }

    if (url.pathname.startsWith("/api/trpc")) {
      const response = await fetchRequestHandler({
        endpoint: "/api/trpc",
        req: request,
        router: appRouter,
        createContext: createWorkerContext,
        onError({ error, path }) {
          console.error(JSON.stringify({ source: "trpc", path, code: error.code, message: error.message }));
        },
      });
      return withCors(response);
    }

    return serveAssets(request, env.ASSETS);
  },
} satisfies { fetch(request: Request, env: WorkerEnv): Promise<Response> };
