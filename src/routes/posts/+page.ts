import { getAllPosts } from '$lib/utils/posts';
import { resolvePostAssetPath } from '$lib/utils/markdown';
import { postStats } from '$lib/data/post-stats';
import type { PageLoad } from './$types';

export const load: PageLoad = () => {
	const posts = getAllPosts().map(post => {
		const stats = postStats[post.slug] ?? { wordCount: 0, readTime: 1 };
		return {
			...post,
			stats,
			metadata: {
				...post.metadata,
				image: resolvePostAssetPath(post.slug, post.metadata.image)
			}
		};
	});

	return { posts };
};
