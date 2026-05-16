import type { Post, PostMetadata } from '$lib/types/post';

const postModules = import.meta.glob('/src/content/posts/**/index.md', { eager: true });

export function getAllPosts(): Post[] {
	const posts: Post[] = [];

	for (const [path, module] of Object.entries(postModules)) {
		const slug = path.split('/').slice(-2, -1)[0];
		const mod = module as Record<string, unknown>;

		const metadata = mod.metadata as PostMetadata;
		if (metadata.draft) continue;

		posts.push({
			slug,
			metadata,
			content: ''
		});
	}

	return posts.sort((a, b) => {
		if (a.metadata.pinned && !b.metadata.pinned) return -1;
		if (!a.metadata.pinned && b.metadata.pinned) return 1;
		return new Date(b.metadata.date || b.metadata.published).getTime() - new Date(a.metadata.date || a.metadata.published).getTime();
	});
}

export function getPostBySlug(slug: string): Post | undefined {
	const posts = getAllPosts();
	return posts.find((post) => post.slug === slug);
}

export async function getPostComponent(slug: string) {
	try {
		const modules = import.meta.glob('/src/content/posts/**/index.md');
		const path = `/src/content/posts/${slug}/index.md`;

		if (path in modules) {
			const mod = await modules[path]();
			return (mod as Record<string, unknown>).default;
		}
	} catch (error) {
		console.error('Error loading post component:', error);
	}

	return null;
}
