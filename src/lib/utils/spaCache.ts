interface CacheEntry<T> {
	data: T;
	timestamp: number;
}

class SPACache {
	private cache = new Map<string, CacheEntry<unknown>>();

	async get<T>(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T> {
		const cached = this.cache.get(key);
		const now = Date.now();
		if (cached && (!ttl || now - cached.timestamp < ttl)) {
			return cached.data as T;
		}
		const data = await fetcher();
		this.cache.set(key, { data, timestamp: now });
		return data;
	}

	set<T>(key: string, data: T): void {
		this.cache.set(key, { data, timestamp: Date.now() });
	}

	clear(key: string): void {
		this.cache.delete(key);
	}

	has(key: string): boolean {
		return this.cache.has(key);
	}

	peek<T>(key: string): T | undefined {
		const cached = this.cache.get(key);
		return cached?.data as T | undefined;
	}

	clearAll(): void {
		this.cache.clear();
	}
}

export const spaCache = new SPACache();
