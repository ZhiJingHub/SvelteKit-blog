import { browser } from '$app/environment';

const cache = new Map<string, number>();
let pendingPaths = new Set<string>();
let pendingResolve: ((result: Map<string, number>) => void) | null = null;
let batchTimer: ReturnType<typeof setTimeout> | null = null;

function flushBatch() {
	if (pendingPaths.size === 0) return;

	const paths = Array.from(pendingPaths);
	pendingPaths.clear();
	batchTimer = null;

	const query = paths.map((p) => encodeURIComponent(p)).join(',');
	fetch(`/api/views?paths=${query}`)
		.then((res) => res.json())
		.then((data: number[]) => {
			const result = new Map<string, number>();
			paths.forEach((p, i) => {
				const c = data[i] || 0;
				cache.set(p, c);
				result.set(p, c);
			});
			if (pendingResolve) {
				pendingResolve(result);
				pendingResolve = null;
			}
		})
		.catch(() => {
			if (pendingResolve) {
				pendingResolve(new Map());
				pendingResolve = null;
			}
		});
}

export function batchGetViews(paths: string[]): Promise<Map<string, number>> {
	if (!browser) return Promise.resolve(new Map());

	const uncached = paths.filter((p) => !cache.has(p));

	if (uncached.length === 0) {
		const result = new Map<string, number>();
		paths.forEach((p) => result.set(p, cache.get(p) || 0));
		return Promise.resolve(result);
	}

	for (const p of uncached) pendingPaths.add(p);

	if (batchTimer) clearTimeout(batchTimer);
	batchTimer = setTimeout(flushBatch, 50);

	return new Promise((resolve) => {
		const prevResolve = pendingResolve;
		pendingResolve = (result) => {
			if (prevResolve) prevResolve(result);
			const final = new Map<string, number>();
			paths.forEach((p) => final.set(p, cache.get(p) || 0));
			resolve(final);
		};
	});
}

export function getViewCache(path: string): number | undefined {
	return cache.get(path);
}
