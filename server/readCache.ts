type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<unknown>>();

export async function getCached<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const existing = cache.get(key) as CacheEntry<T> | undefined;
  if (existing && existing.expiresAt > now) return existing.value;

  const value = await loader();
  cache.set(key, { value, expiresAt: now + ttlMs });
  return value;
}

export function invalidateCache(key: string) {
  cache.delete(key);
}

export function invalidateCachePrefix(prefix: string) {
  cache.forEach((_entry, key) => {
    if (key.startsWith(prefix)) cache.delete(key);
  });
}
