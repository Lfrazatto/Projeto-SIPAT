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
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  ADMIN_ACCESS_KEY?: string;
}

let seedPromise: Promise<void> | null = null;

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
    if (!seedPromise) {
      seedPromise = ensureInitialSeeds().catch((error) => {
        console.error("[Worker] seed failed", error);
      });
    }
    // O catálogo e os hotspots precisam existir antes da primeira resposta.
    // Antes o seed era disparado em background e o primeiro acesso podia receber
    // um catálogo vazio, deixando o Ache o Erro e o editor Admin sem cenários.
    await seedPromise;

    const url = new URL(request.url);
    if (env.ASSET_BUCKET && url.pathname.startsWith("/assets/")) {
      const key = url.pathname.slice("/assets/".length);
      const object = await env.ASSET_BUCKET.get(key);
      // O pacote estático do Worker é o fallback oficial: assim o site continua
      // funcionando mesmo durante a migração ou se um objeto ainda não estiver no R2.
      if (!object) return serveAssets(request, env.ASSETS);
      const headers = new Headers();
      object.writeHttpMetadata(headers as any);
      headers.set("etag", object.httpEtag);
      headers.set("cache-control", "public, max-age=31536000, immutable");
      return new Response(object.body as unknown as BodyInit, { headers });
    }
    if (url.pathname.startsWith("/api/trpc")) {
      const response = await fetchRequestHandler({
        endpoint: "/api/trpc",
        req: request,
        router: appRouter,
        createContext: ({ req, resHeaders }) => createWorkerContext({ req, resHeaders, r2: env.ASSET_BUCKET as any }),
        onError({ error, path }) {
          console.error(JSON.stringify({ source: "trpc", path, code: error.code, message: error.message }));
        },
      });
      return withCors(response);
    }

    return serveAssets(request, env.ASSETS);
  },
} satisfies { fetch(request: Request, env: WorkerEnv): Promise<Response> };
