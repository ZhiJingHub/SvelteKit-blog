import { getAllPosts } from '$lib/utils/posts';
import { siteConfig } from '$lib/config/site';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = () => {
	const posts = getAllPosts();

	const urls = [
		`<url><loc>${siteConfig.url}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>`,
		`<url><loc>${siteConfig.url}/posts/</loc><changefreq>daily</changefreq><priority>0.9</priority></url>`
	];

	for (const post of posts) {
		urls.push(
			`<url><loc>${siteConfig.url}/posts/${post.slug}/</loc><lastmod>${post.metadata.updated || post.metadata.published}</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>`
		);
	}

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
};
