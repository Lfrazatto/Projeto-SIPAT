export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  adminAccessKey: process.env.ADMIN_ACCESS_KEY ?? "",
};

export type WorkerRuntimeEnv = {
  JWT_SECRET?: string;
  DATABASE_URL?: string;
  ADMIN_ACCESS_KEY?: string;
};

export function configureRuntimeEnv(runtime: WorkerRuntimeEnv) {
  if (runtime.JWT_SECRET !== undefined) ENV.cookieSecret = runtime.JWT_SECRET;
  if (runtime.DATABASE_URL !== undefined) ENV.databaseUrl = runtime.DATABASE_URL;
  if (runtime.ADMIN_ACCESS_KEY !== undefined) ENV.adminAccessKey = runtime.ADMIN_ACCESS_KEY;
}
