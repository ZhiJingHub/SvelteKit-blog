import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const devStore = new Map<string, number>();

export const POST: RequestHandler = async ({ request, platform }) => {
	let paths: string[];
	try {
		paths = (await request.json()) as string[];
		if (!Array.isArray(paths)) return json([0]);
	} catch {
		return json([0]);
	}

	const results: number[] = [];

	for (const path of paths) {
		const key = path.replace(/\/$/, '') || '/';

		if (dev || !platform) {
			const current = devStore.get(key) || 0;
			const next = current + 1;
			devStore.set(key, next);
			results.push(next);
			continue;
		}

		const cf = platform as Record<string, unknown> | undefined;
		const kv = cf?.env as Record<string, unknown> | undefined;
		const pageviews = kv?.PAGEVIEWS as { get: (k: string) => Promise<string | null>; put: (k: string, v: string) => Promise<void> } | undefined;
		let count: number;
		try {
			if (pageviews) {
				const current = parseInt((await pageviews.get(key)) || '0');
				count = current + 1;
				await pageviews.put(key, String(count));
			} else {
				count = 0;
			}
		} catch {
			count = 0;
		}
		results.push(count);
	}

	return json(results);
};
