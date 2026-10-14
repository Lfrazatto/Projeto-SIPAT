import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./routers";
import { createWorkerContext } from "./_core/workerContext";
import { configureWorkerDatabase, ensureInitialSeeds } from "./db";
import { configureRuntimeEnv } from "./_core/env";
import { sdk } from "./_core/sdk";
import { upsertUser } from "./db";
import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";

export interface WorkerEnv {
  ASSETS: { fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> };
  HYPERDRIVE?: { host: string; user: string; password: string; database: string; port: number };
  DATABASE_URL?: string;
  JWT_SECRET?: string;
  ADMIN_ACCESS_KEY?: string;
  VITE_APP_ID?: string;
  OAUTH_SERVER_URL?: string;
  OWNER_OPEN_ID?: string;
  BUILT_IN_FORGE_API_URL?: string;
  BUILT_IN_FORGE_API_KEY?: string;
}

function isTrpcRequest(request: Request) {
  return new URL(request.url).pathname.startsWith("/api/trpc");
}

let seedsStarted = false;

function withCors(response: Response) {
  const headers = new Headers(response.headers);
  headers.set("access-control-allow-origin", headers.get("origin") ?? "*");
  headers.set("access-control-allow-credentials", "true");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

function serializeCookie(name: string, value: string, options: { maxAge?: number; expires?: Date; httpOnly?: boolean; path?: string; sameSite?: string; secure?: boolean }) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(options.maxAge)}`);
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  return parts.join("; ");
}

async function handleStorage(request: Request, env: WorkerEnv) {
  const key = new URL(request.url).pathname.replace(/^\/manus-storage\//, "");
  if (!key || !env.BUILT_IN_FORGE_API_URL || !env.BUILT_IN_FORGE_API_KEY) return new Response("Storage backend not configured", { status: 503 });
  const url = new URL("v1/storage/presign/get", env.BUILT_IN_FORGE_API_URL.replace(/\/+$/, "") + "/");
  url.searchParams.set("path", key);
  const response = await fetch(url, { headers: { Authorization: `Bearer ${env.BUILT_IN_FORGE_API_KEY}` } });
  if (!response.ok) return new Response("Storage backend error", { status: 502 });
  const payload = (await response.json()) as { url?: string };
  return payload.url ? Response.redirect(payload.url, 307) : new Response("Storage URL missing", { status: 502 });
}

async function handleOAuthCallback(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (!code || !state) return Response.json({ error: "code and state are required" }, { status: 400 });
  const { nonce } = decodeOAuthState(state);
  const expectedNonce = parseCookieHeader(request.headers.get("cookie") ?? "")[OAUTH_STATE_COOKIE];
  if (!nonce || nonce !== expectedNonce) return Response.json({ error: "invalid oauth state" }, { status: 403 });
  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
    if (!userInfo.openId) return Response.json({ error: "openId missing from user info" }, { status: 400 });
    await upsertUser({ openId: userInfo.openId, name: userInfo.name || null, email: userInfo.email ?? null, loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null, lastSignedIn: new Date() });
    const sessionToken = await sdk.createSessionToken(userInfo.openId, { name: userInfo.name || "", expiresInMs: ONE_YEAR_MS });
    const headers = new Headers({ Location: "/" });
    headers.append("set-cookie", serializeCookie(OAUTH_STATE_COOKIE, "", { expires: new Date(0), maxAge: 0, path: "/", secure: true, sameSite: "None" }));
    headers.append("set-cookie", serializeCookie(COOKIE_NAME, sessionToken, { maxAge: ONE_YEAR_MS / 1000, path: "/", httpOnly: true, secure: true, sameSite: "None" }));
    return new Response(null, { status: 302, headers });
  } catch (error) {
    console.error("[Worker] OAuth callback failed", error);
    return Response.json({ error: "OAuth callback failed" }, { status: 500 });
  }
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    configureRuntimeEnv(env);
    configureWorkerDatabase(env);
    if (!seedsStarted) {
      seedsStarted = true;
      void ensureInitialSeeds().catch((error) => console.error("[Worker] seed failed", error));
    }

    if (request.method === "OPTIONS" && isTrpcRequest(request)) {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": request.headers.get("origin") ?? "*",
          "access-control-allow-credentials": "true",
          "access-control-allow-headers": "content-type, authorization",
          "access-control-allow-methods": "GET, POST, OPTIONS",
        },
      });
    }

    const pathname = new URL(request.url).pathname;
    if (pathname.startsWith("/manus-storage/")) return handleStorage(request, env);
    if (pathname === "/api/oauth/callback") return handleOAuthCallback(request);

    if (isTrpcRequest(request)) {
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

    return env.ASSETS.fetch(request as never);
  },
} satisfies { fetch(request: Request, env: WorkerEnv): Promise<Response> };
