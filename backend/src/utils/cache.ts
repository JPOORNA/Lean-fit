interface CacheEntry<T> {
  data: T;
  expiry: number;
}

export class SimpleCache {
  private store = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiry: Date.now() + ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.store.delete(key);
      return null;
    }
    
    return entry.data;
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

export const serverCache = new SimpleCache();
