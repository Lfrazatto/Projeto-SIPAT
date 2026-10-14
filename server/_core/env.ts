export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  adminAccessKey: process.env.ADMIN_ACCESS_KEY ?? "",
};

export type WorkerRuntimeEnv = {
  VITE_APP_ID?: string;
  JWT_SECRET?: string;
  DATABASE_URL?: string;
  OAUTH_SERVER_URL?: string;
  OWNER_OPEN_ID?: string;
  BUILT_IN_FORGE_API_URL?: string;
  BUILT_IN_FORGE_API_KEY?: string;
  ADMIN_ACCESS_KEY?: string;
};

export function configureRuntimeEnv(runtime: WorkerRuntimeEnv) {
  if (runtime.VITE_APP_ID !== undefined) ENV.appId = runtime.VITE_APP_ID;
  if (runtime.JWT_SECRET !== undefined) ENV.cookieSecret = runtime.JWT_SECRET;
  if (runtime.DATABASE_URL !== undefined) ENV.databaseUrl = runtime.DATABASE_URL;
  if (runtime.OAUTH_SERVER_URL !== undefined) ENV.oAuthServerUrl = runtime.OAUTH_SERVER_URL;
  if (runtime.OWNER_OPEN_ID !== undefined) ENV.ownerOpenId = runtime.OWNER_OPEN_ID;
  if (runtime.BUILT_IN_FORGE_API_URL !== undefined) ENV.forgeApiUrl = runtime.BUILT_IN_FORGE_API_URL;
  if (runtime.BUILT_IN_FORGE_API_KEY !== undefined) ENV.forgeApiKey = runtime.BUILT_IN_FORGE_API_KEY;
  if (runtime.ADMIN_ACCESS_KEY !== undefined) ENV.adminAccessKey = runtime.ADMIN_ACCESS_KEY;
}
