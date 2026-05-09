<script lang="ts">
	import { siteConfig } from '$lib/config/site';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const posts = $derived(data.posts);

	let searchQuery = $state('');
	let currentPage = $state(1);
	const postsPerPage = 10;

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	let filteredPosts = $derived.by(() => {
		if (!searchQuery.trim()) return posts;

		const query = searchQuery.toLowerCase();
		return posts.filter(post =>
			post.metadata.title.toLowerCase().includes(query) ||
			post.metadata.description.toLowerCase().includes(query) ||
			post.slug.toLowerCase().includes(query)
		);
	});

	let totalPages = $derived(Math.max(1, Math.ceil(filteredPosts.length / postsPerPage)));

	let paginatedPosts = $derived.by(() => {
		const start = (currentPage - 1) * postsPerPage;
		return filteredPosts.slice(start, start + postsPerPage);
	});

	$effect(() => {
		if (currentPage > totalPages) {
			currentPage = totalPages;
		}
	});
</script>

<svelte:head>
	<title>博客 - {siteConfig.title}</title>
</svelte:head>

<div class="container mx-auto max-w-3xl px-4 py-12">
	<div class="mb-8">
		<a href="/" class="text-sm text-muted-foreground hover:text-foreground transition-colors">← 返回首页</a>
	</div>

	<header class="mb-12">
		<h1 class="text-4xl font-bold mb-4">博客</h1>
		<p class="text-lg text-muted-foreground">共 {posts.length} 篇文章</p>
	</header>

	<div class="mb-8">
		<div class="relative">
			<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
				<circle cx="11" cy="11" r="8"></circle>
				<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
			</svg>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="搜索文章..."
				class="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
				oninput={() => { currentPage = 1; }}
			/>
		</div>
	</div>

	{#if filteredPosts.length === 0}
		<div class="text-center py-12 text-muted-foreground">
			<p class="text-lg">没有找到匹配的文章</p>
		</div>
	{:else}
		<div class="space-y-6">
			{#each paginatedPosts as post (post.slug)}
				<a href="/posts/{post.slug}/" class="block group">
					<article class="rounded-xl border border-border bg-card p-6 hover:border-ring/50 hover:shadow-lg transition-all duration-200">
						<div class="flex items-start justify-between gap-4 mb-3">
							<h2 class="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
								{post.metadata.title}
							</h2>
							{#if post.metadata.pinned}
								<span class="shrink-0 inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
									置顶
								</span>
							{/if}
						</div>

						<p class="text-muted-foreground mb-4 line-clamp-2">{post.metadata.description}</p>

						<div class="flex items-center gap-4 text-sm text-muted-foreground">
							<time datetime={post.metadata.published}>{formatDate(post.metadata.published)}</time>
							{#if post.metadata.updated}
								<span class="text-xs">更新于 {formatDate(post.metadata.updated)}</span>
							{/if}
						</div>
					</article>
				</a>
			{/each}
		</div>

		{#if totalPages > 1}
			<nav class="mt-8 flex items-center justify-center gap-2">
				<button
					onclick={() => { currentPage = Math.max(1, currentPage - 1); }}
					disabled={currentPage === 1}
					class="inline-flex items-center justify-center rounded-md w-10 h-10 border border-border hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="15 18 9 12 15 6"></polyline>
					</svg>
				</button>

				{#each Array.from({ length: totalPages }, (_, i) => i + 1) as page}
					{#if page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)}
						<button
							onclick={() => { currentPage = page; }}
							class="inline-flex items-center justify-center rounded-md w-10 h-10 text-sm border border-border hover:bg-accent transition-colors"
							class:bg-primary={page === currentPage}
							class:text-primary-foreground={page === currentPage}
						>
							{page}
						</button>
					{:else if page === currentPage - 2 || page === currentPage + 2}
						<span class="w-10 h-10 flex items-center justify-center text-muted-foreground">...</span>
					{/if}
				{/each}

				<button
					onclick={() => { currentPage = Math.min(totalPages, currentPage + 1); }}
					disabled={currentPage === totalPages}
					class="inline-flex items-center justify-center rounded-md w-10 h-10 border border-border hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					<svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<polyline points="9 18 15 12 9 6"></polyline>
					</svg>
				</button>
			</nav>
		{/if}
	{/if}
</div>
