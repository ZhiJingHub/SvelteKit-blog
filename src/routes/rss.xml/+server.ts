import { getAllPosts } from '$lib/utils/posts';
import { siteConfig } from '$lib/config/site';
import { Feed } from 'feed';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = () => {
	const posts = getAllPosts();

	const feed = new Feed({
		title: siteConfig.title,
		description: siteConfig.description,
		id: siteConfig.url,
		link: siteConfig.url,
		language: siteConfig.lang,
		image: `${siteConfig.url}${siteConfig.ogImage}`,
		favicon: `${siteConfig.url}${siteConfig.icon}`,
		copyright: `All rights reserved ${new Date().getFullYear()}, ${siteConfig.author.name}`,
		updated: new Date(posts[0]?.metadata.published || new Date()),
		feedLinks: {
			rss2: `${siteConfig.url}/rss.xml`
		},
		author: {
			name: siteConfig.author.name,
			link: siteConfig.author.url
		}
	});

	for (const post of posts) {
		feed.addItem({
			title: post.metadata.title,
			id: `${siteConfig.url}/posts/${post.slug}/`,
			link: `${siteConfig.url}/posts/${post.slug}/`,
			description: post.metadata.description,
			date: new Date(post.metadata.published),
			image: post.metadata.image
				? post.metadata.image.startsWith('http')
					? post.metadata.image
					: `${siteConfig.url}${post.metadata.image}`
				: undefined
		});
	}

	return new Response(feed.rss2(), {
		headers: {
			'Content-Type': 'application/rss+xml'
		}
	});
};
