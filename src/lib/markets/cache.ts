/**
 * Simple in-memory cache for market data quotes.
 *
 * Uses a Map with TTL-based expiration. Designed for server-side only —
 * never used in browser bundles. Each quote is cached independently by
 * its symbol, with a configurable TTL.
 *
 * For the foundation stage, this is sufficient. A production deployment
 * with multiple Vercel instances would benefit from Redis or Upstash,
 * but that optimization belongs to a later stage.
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Get a cached value by key. Returns null if expired or missing.
 */
export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

/**
 * Set a value in the cache with a TTL in milliseconds.
 */
export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Clear all cached entries. Useful for testing.
 */
export function cacheClear(): void {
  store.clear();
}

/**
 * Get the number of entries in the cache.
 */
export function cacheSize(): number {
  return store.size;
}

// ── Default TTLs ──────────────────────────────────────────────

/** 5 minutes for crypto (CoinGecko free tier allows frequent calls) */
export const CRYPTO_CACHE_TTL = 5 * 60 * 1000;

/** 15 minutes for Yahoo Finance assets (delayed data anyway) */
export const YAHOO_CACHE_TTL = 15 * 60 * 1000;
