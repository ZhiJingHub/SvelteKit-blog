<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import * as Pagination from '$lib/components/ui/pagination';
	import Icon from '@iconify/svelte';
	import { siteConfig } from '$lib/config/site';
	import { onMount } from 'svelte';
	import { spaCache } from '$lib/utils/spaCache';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const posts = $derived(data.posts);

	let searchQuery = $state('');
	let allPosts = $state<Array<{ title: string; link: string; description: string; date: string; content: string; wordCount: number; readTime: number }>>([]);
	let isLoading = $state(false);
	let hasLoaded = $state(false);

	let currentPage = $state(1);
	const postsPerPage = 10;

	let expandedCards = $state<Record<string, boolean>>({});

	let searchFilters = $state({
		title: true,
		description: true,
		content: true,
		path: true
	});

	function calculateWordCount(text: string): number {
		const plainText = text.replace(/<[^>]*>/g, '');
		const chineseChars = plainText.match(/[\u4e00-\u9fa5]/g) || [];
		const englishWords = plainText.match(/[a-zA-Z]+/g) || [];
		return chineseChars.length + englishWords.length;
	}

	function calculateReadTime(wordCount: number): number {
		return Math.ceil(wordCount / 300);
	}

	async function loadRSS() {
		if (hasLoaded) return;
		isLoading = true;
		allPosts = await spaCache.get('posts-rss', async () => {
			const response = await fetch('/rss.xml');
			const text = await response.text();
			const parser = new DOMParser();
			const xml = parser.parseFromString(text, 'text/xml');
			const items = xml.querySelectorAll('item');

			return Array.from(items).map(item => {
				const content = item.querySelector('content\\:encoded, encoded')?.textContent || '';
				const wordCount = calculateWordCount(content);
				const readTime = calculateReadTime(wordCount);

				return {
					title: item.querySelector('title')?.textContent || '',
					link: item.querySelector('link')?.textContent || '',
					description: item.querySelector('description')?.textContent || '',
					date: item.querySelector('pubDate')?.textContent || '',
					content,
					wordCount,
					readTime
				};
			});
		});
		hasLoaded = true;
		isLoading = false;
	}

	function parseQueryTerms(query: string): string[] {
		const terms: string[] = [];
		const re = /"([^"]+)"|(\S+)/g;
		let m: RegExpExecArray | null;
		while ((m = re.exec(query)) !== null) {
			const t = (m[1] ?? m[2] ?? '').trim().toLowerCase();
			if (t) terms.push(t);
		}
		return terms;
	}

	function highlightText(text: string, query: string): string {
		const terms = parseQueryTerms(query);
		if (terms.length === 0) return text;
		const escaped = terms
			.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
			.sort((a, b) => b.length - a.length);
		const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
		return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
	}

	function getMatchedContentLines(content: string, query: string): string[] {
		const terms = parseQueryTerms(query);
		if (terms.length === 0) return [];
		const lines = content.split('\n');
		const matched: string[] = [];

		for (const line of lines) {
			const lower = line.toLowerCase();
			if (!terms.every((t) => lower.includes(t))) continue;
			const trimmed = line.trim();
			if (trimmed && !trimmed.startsWith('#') && trimmed.length > 10) {
				matched.push(trimmed);
			}
		}
		return matched;
	}

	function getPostStats(slug: string): { wordCount: number; readTime: number } | null {
		const rssPost = allPosts.find(rss => rss.link.includes(slug));
		return rssPost ? { wordCount: rssPost.wordCount, readTime: rssPost.readTime } : null;
	}

	let filteredPostsWithMatches = $derived.by(() => {
		if (!searchQuery.trim()) return posts.map(p => ({ post: p, matchedLines: [] }));

		const hasAnyFilter = searchFilters.title || searchFilters.description || searchFilters.content || searchFilters.path;
		if (!hasAnyFilter) return [];

		const terms = parseQueryTerms(searchQuery);
		if (terms.length === 0) return posts.map(p => ({ post: p, matchedLines: [] }));

		const results: Array<{ post: typeof posts[0], matchedLines: string[] }> = [];

		for (const post of posts) {
			const rssPost = allPosts.find(rss => rss.link.includes(post.slug));
			if (!rssPost) continue;

			const title = rssPost.title.toLowerCase();
			const desc = rssPost.description.toLowerCase();
			const content = rssPost.content.toLowerCase();
			const slug = post.slug.toLowerCase();

			const allHit = terms.every((t) => {
				return (
					(searchFilters.title && title.includes(t)) ||
					(searchFilters.description && desc.includes(t)) ||
					(searchFilters.content && content.includes(t)) ||
					(searchFilters.path && slug.includes(t))
				);
			});
			if (!allHit) continue;

			const contentHasAll = searchFilters.content && terms.every((t) => content.includes(t));
			const matchedLines = contentHasAll
				? getMatchedContentLines(rssPost.content, searchQuery)
				: [];
			results.push({ post, matchedLines });
		}

		return results;
	});

	let paginatedPosts = $derived.by(() => {
		const allResults = filteredPostsWithMatches;
		const startIndex = (currentPage - 1) * postsPerPage;
		return allResults.slice(startIndex, startIndex + postsPerPage);
	});

	let totalPages = $derived(Math.ceil(filteredPostsWithMatches.length / postsPerPage));

	$effect(() => {
		searchQuery;
		searchFilters.title;
		searchFilters.description;
		searchFilters.content;
		searchFilters.path;
		currentPage = 1;
		expandedCards = {};
	});

	let hasAnyFilter = $derived(searchFilters.title || searchFilters.description || searchFilters.content || searchFilters.path);

	let totalStats = $derived.by(() => {
		if (!hasLoaded) return { totalPosts: posts.length, totalWords: 0 };
		const totalWords = allPosts.reduce((sum, post) => sum + post.wordCount, 0);
		return { totalPosts: posts.length, totalWords };
	});

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	onMount(() => {
		loadRSS();
	});
</script>

<svelte:head>
	<title>文章列表 - {siteConfig.title}</title>
	<meta name="description" content="浏览所有文章" />
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-12">
	<div class="mb-12 text-center">
		<h1 class="mb-4 text-4xl font-bold">文章列表</h1>
		<p class="text-muted-foreground">分享技术、想法和经验</p>
		{#if hasLoaded}
			<p class="mt-2 text-sm text-muted-foreground">
				共 {totalStats.totalPosts} 篇文章 · 总计 {totalStats.totalWords.toLocaleString()} 字
			</p>
		{/if}
	</div>

	<div class="mb-8">
		<Input
			type="text"
			bind:value={searchQuery}
			onfocus={loadRSS}
			placeholder="搜索文章标题、描述或内容..."
			class="w-full"
		/>

		<div class="mt-3 flex flex-wrap gap-4">
			<label class="flex items-center gap-2 cursor-pointer">
				<Checkbox bind:checked={searchFilters.title} />
				<span class="text-sm">标题</span>
			</label>
			<label class="flex items-center gap-2 cursor-pointer">
				<Checkbox bind:checked={searchFilters.description} />
				<span class="text-sm">简介</span>
			</label>
			<label class="flex items-center gap-2 cursor-pointer">
				<Checkbox bind:checked={searchFilters.content} />
				<span class="text-sm">正文</span>
			</label>
			<label class="flex items-center gap-2 cursor-pointer">
				<Checkbox bind:checked={searchFilters.path} />
				<span class="text-sm">路径</span>
			</label>
		</div>

		{#if searchQuery}
			<div class="mt-2 min-h-[20px]">
				{#if !hasAnyFilter}
					<p class="text-sm text-red-500">请至少选择一个搜索范围</p>
				{:else if isLoading}
					<p class="text-sm text-muted-foreground">搜索中...</p>
				{:else if filteredPostsWithMatches.length === 0}
					<p class="text-sm text-muted-foreground">未找到匹配的文章</p>
				{:else}
					<p class="text-sm text-muted-foreground">找到 {filteredPostsWithMatches.length} 篇文章</p>
				{/if}
			</div>
		{/if}
	</div>

	<div class="space-y-6">
		{#each paginatedPosts as { post, matchedLines }}
			<a href="/posts/{post.slug}" class="block">
				<Card.Root class="group transition-all hover:shadow-lg">
					<Card.Content class="p-6">
						<div class="flex flex-col gap-4 md:flex-row">
							{#if post.metadata.image}
								<div class="md:w-48 md:flex-shrink-0">
									<img
										src={post.metadata.image}
										alt={post.metadata.title}
										class="h-48 w-full rounded-md object-cover md:h-32"
									/>
								</div>
							{/if}

							<div class="flex-1">
								<div class="mb-2 flex items-center gap-2">
									{#if post.metadata.pinned}
										<Badge>置顶</Badge>
									{/if}
									<time class="text-sm text-muted-foreground">
										{formatDate(post.metadata.published)}
									</time>
									{#if hasLoaded}
										{@const stats = getPostStats(post.slug)}
										{#if stats}
											<span class="text-sm text-muted-foreground">·</span>
											<span class="text-sm text-muted-foreground">{stats.wordCount} 字</span>
											<span class="text-sm text-muted-foreground">·</span>
											<span class="text-sm text-muted-foreground">约 {stats.readTime} 分钟</span>
										{/if}
									{/if}
								</div>

								<h2 class="mb-2 text-2xl font-semibold group-hover:text-primary">
									{@html highlightText(post.metadata.title, searchQuery)}
								</h2>

								<p class="text-muted-foreground">
									{@html highlightText(post.metadata.description, searchQuery)}
								</p>

								{#if matchedLines.length > 0}
									{@const isExpanded = expandedCards[post.slug] ?? false}
									{@const displayLines = isExpanded ? matchedLines : matchedLines.slice(0, 3)}
									{@const hasMore = matchedLines.length > 3}

									<div class="mt-3 space-y-2">
										<div class="space-y-1 border-l-2 border-primary/30 pl-3">
											{#each displayLines as line, idx}
												<button
													type="button"
													onclick={(e) => {
														e.preventDefault();
														e.stopPropagation();
														const url = `/posts/${post.slug}?highlight=${encodeURIComponent(searchQuery)}`;
														window.open(url, '_blank');
													}}
													class="block w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors"
												>
													<span class="inline-flex items-start gap-1.5">
														<Icon
															icon="mdi:arrow-right-thin"
															class="size-4 flex-shrink-0 mt-0.5 opacity-50"
														/>
														<span>{@html highlightText(line, searchQuery)}</span>
													</span>
												</button>
											{/each}
										</div>

										{#if hasMore}
											<button
												type="button"
												onclick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													expandedCards[post.slug] = !isExpanded;
												}}
												class="text-xs text-primary hover:underline flex items-center gap-1"
											>
												<Icon
													icon={isExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}
													class="size-4"
												/>
												{isExpanded
													? '收起'
													: `展开 (还有 ${matchedLines.length - 3} 行)`}
											</button>
										{/if}
									</div>
								{/if}
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</a>
		{/each}
	</div>

	{#if paginatedPosts.length === 0 && !searchQuery}
		<div class="py-12 text-center">
			<p class="text-muted-foreground">暂无文章</p>
		</div>
	{/if}

	{#if totalPages > 1}
		<div class="mt-8 flex justify-center">
			<Pagination.Root count={filteredPostsWithMatches.length} perPage={postsPerPage} bind:page={currentPage}>
				{#snippet children({ pages })}
					<Pagination.Content>
						<Pagination.Item>
							<Pagination.PrevButton />
						</Pagination.Item>
						{#each pages as page (page.key)}
							{#if page.type === 'ellipsis'}
								<Pagination.Item>
									<Pagination.Ellipsis />
								</Pagination.Item>
							{:else}
								<Pagination.Item>
									<Pagination.Link {page} isActive={currentPage === page.value}>
										{page.value}
									</Pagination.Link>
								</Pagination.Item>
							{/if}
						{/each}
						<Pagination.Item>
							<Pagination.NextButton />
						</Pagination.Item>
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>
		</div>
	{/if}
</div>
