import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = () => {
	return new Response(
		`User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n`,
		{
			headers: {
				'Content-Type': 'text/plain'
			}
		}
	);
};
