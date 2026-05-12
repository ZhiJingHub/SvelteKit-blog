import { getAllPosts, getPostBySlug, getPostComponent } from '$lib/utils/posts';
import { resolvePostAssetPath } from '$lib/utils/markdown';
import { postStats } from '$lib/data/post-stats';
import { error } from '@sveltejs/kit';
import type { EntryGenerator, PageLoad } from './$types';

export const prerender = true;

export const entries: EntryGenerator = () => {
	return getAllPosts().map((post) => ({ slug: post.slug }));
};

export const load: PageLoad = async ({ params }) => {
	const post = getPostBySlug(params.slug);

	if (!post) {
		throw error(404, '文章不存在');
	}

	const component = await getPostComponent(params.slug);

	if (!component) {
		throw error(404, '文章内容加载失败');
	}

	const metadata = {
		...post.metadata,
		image: resolvePostAssetPath(params.slug, post.metadata.image)
	};

	return {
		post: {
			...post,
			metadata
		},
		stats: postStats[params.slug] ?? { wordCount: 0, readTime: 1 },
		component,
		slug: params.slug
	};
};
