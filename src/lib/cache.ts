/**
 * Generic in-memory cache with TTL support.
 *
 * Server-side only — each serverless invocation gets a fresh cache,
 * but within a single invocation (or long-running dev server) entries
 * are reused until they expire.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/** TTL presets in milliseconds. */
export const CacheTTL = {
  /** Dashboard stats, fast-changing data */
  SHORT: 2 * 60 * 1000,           // 2 min
  /** Recommendations, per-company data */
  MEDIUM: 5 * 60 * 1000,          // 5 min
  /** Company info, user profiles */
  LONG: 30 * 60 * 1000,           // 30 min
  /** Product catalogus, relatively stable */
  HOUR: 60 * 60 * 1000,           // 1 hour
  /** Distributor prices, external data */
  DAY: 24 * 60 * 60 * 1000,       // 24 hours
} as const;

class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;
  private readonly MAX_ENTRIES = 1000;

  constructor() {
    // Periodic cleanup every 5 minutes to prevent memory leaks
    if (typeof setInterval !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
      // Allow the process to exit even if the interval is active
      if (this.cleanupInterval && typeof this.cleanupInterval === "object" && "unref" in this.cleanupInterval) {
        this.cleanupInterval.unref();
      }
    }
  }

  /** Get a cached value by key. Returns null if expired or missing. */
  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /** Set a cached value with TTL in milliseconds. */
  set<T>(key: string, value: T, ttlMs: number): void {
    // Evict oldest entries if we hit the max
    if (this.store.size >= this.MAX_ENTRIES) {
      this.cleanup();
      // If still full after cleanup, remove the oldest entry
      if (this.store.size >= this.MAX_ENTRIES) {
        const firstKey = this.store.keys().next().value;
        if (firstKey !== undefined) {
          this.store.delete(firstKey);
        }
      }
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  /**
   * Invalidate cache entries matching a pattern.
   * Supports prefix matching with trailing wildcard: "products:*"
   * Or exact key match without wildcard.
   */
  invalidate(pattern: string): void {
    if (pattern.endsWith("*")) {
      const prefix = pattern.slice(0, -1);
      this.store.forEach((_, key) => {
        if (key.startsWith(prefix)) {
          this.store.delete(key);
        }
      });
    } else {
      this.store.delete(pattern);
    }
  }

  /** Remove all expired entries. */
  private cleanup(): void {
    const now = Date.now();
    this.store.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    });
  }

  /** Clear the entire cache. */
  clear(): void {
    this.store.clear();
  }

  /** Get the number of entries (including possibly expired). */
  get size(): number {
    return this.store.size;
  }
}

/** Singleton cache instance. */
export const cache = new MemoryCache();

/**
 * Cache-through helper: returns cached value if available,
 * otherwise calls the fetcher, caches the result, and returns it.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const existing = cache.get<T>(key);
  if (existing !== null) return existing;

  const value = await fetcher();
  cache.set(key, value, ttlMs);
  return value;
}
