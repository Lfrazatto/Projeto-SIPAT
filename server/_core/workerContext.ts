import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { TrpcContext } from "./context";

function requestHeaders(request: Request): Record<string, string> {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });
  return headers;
}

function createRequestShim(request: Request) {
  const headers = requestHeaders(request);
  const url = new URL(request.url);
  return {
    headers,
    protocol: url.protocol.replace(":", ""),
    hostname: url.hostname,
    method: request.method,
    originalUrl: `${url.pathname}${url.search}`,
    query: Object.fromEntries(url.searchParams.entries()),
  };
}

function serializeCookie(name: string, value: string, options: Record<string, unknown> = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${Math.floor(Number(options.maxAge))}`);
  if (options.expires instanceof Date) parts.push(`Expires=${options.expires.toUTCString()}`);
  if (typeof options.domain === "string") parts.push(`Domain=${options.domain}`);
  if (typeof options.path === "string") parts.push(`Path=${options.path}`);
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.secure) parts.push("Secure");
  if (options.sameSite === true) parts.push("SameSite=Strict");
  if (typeof options.sameSite === "string") {
    parts.push(`SameSite=${options.sameSite[0].toUpperCase()}${options.sameSite.slice(1)}`);
  }
  return parts.join("; ");
}

function createResponseShim(resHeaders: { append(name: string, value: string): void }) {
  return {
    cookie(name: string, value: string, options: Record<string, unknown> = {}) {
      resHeaders.append("set-cookie", serializeCookie(name, value, options));
    },
    clearCookie(name: string, options: Record<string, unknown> = {}) {
      resHeaders.append(
        "set-cookie",
        serializeCookie(name, "", { ...options, expires: new Date(0), maxAge: 0 }),
      );
    },
  };
}

export async function createWorkerContext({ req, resHeaders, r2 }: Pick<FetchCreateContextFnOptions, "req" | "resHeaders"> & { r2?: TrpcContext["r2"] }): Promise<TrpcContext> {
  const requestShim = createRequestShim(req);
  let user: TrpcContext["user"] = null;

  return {
    req: requestShim as never,
    res: createResponseShim(resHeaders) as never,
    user,
    r2,
  };
}
