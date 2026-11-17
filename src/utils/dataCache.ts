// Simple memory-based caching layer with TTL & stale-while-revalidate capabilities

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class DataCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  get<T>(key: string, maxAgeMs = this.defaultTTL): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isStale = Date.now() - entry.timestamp > maxAgeMs;
    // Return cached data even if stale (stale-while-revalidate principle)
    return entry.data;
  }

  isStale(key: string, maxAgeMs = this.defaultTTL): boolean {
    const entry = this.cache.get(key);
    if (!entry) return true;
    return Date.now() - entry.timestamp > maxAgeMs;
  }

  invalidate(keyPrefix?: string): void {
    if (!keyPrefix) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(keyPrefix)) {
        this.cache.delete(key);
      }
    }
  }
}

export const dataCache = new DataCacheManager();
