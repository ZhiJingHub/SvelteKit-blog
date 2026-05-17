import { dev } from '$app/environment';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const devStore = new Map<string, number>();

export const GET: RequestHandler = async ({ url, platform }) => {
	const paths = url.searchParams.get('paths');
	if (!paths) return json([]);

	const pathList = paths.split(',').filter(Boolean);
	const results: number[] = [];

	for (const path of pathList) {
		const key = path.replace(/\/$/, '') || '/';

		if (dev || !platform?.env?.PAGEVIEWS) {
			results.push(devStore.get(key) || 0);
			continue;
		}

		try {
			const current = parseInt((await platform.env.PAGEVIEWS.get(key)) || '0');
			results.push(current);
		} catch {
			results.push(0);
		}
	}

	return json(results);
};

export const POST: RequestHandler = async ({ request, platform }) => {
	let path: string;
	try {
		const body = (await request.json()) as { path?: string };
		path = body.path || '';
	} catch {
		return json({ count: 0 });
	}

	const key = path.replace(/\/$/, '') || '/';

	if (dev || !platform?.env?.PAGEVIEWS) {
		const current = devStore.get(key) || 0;
		const next = current + 1;
		devStore.set(key, next);
		return json({ count: next });
	}

	try {
		const current = parseInt((await platform.env.PAGEVIEWS.get(key)) || '0');
		const count = current + 1;
		await platform.env.PAGEVIEWS.put(key, String(count));
		return json({ count });
	} catch {
		return json({ count: 0 });
	}
};
