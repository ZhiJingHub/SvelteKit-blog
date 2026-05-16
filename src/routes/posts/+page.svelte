<script lang="ts">
	import { Input } from '$lib/components/ui/input';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Badge } from '$lib/components/ui/badge';
	import * as Card from '$lib/components/ui/card';
	import * as Pagination from '$lib/components/ui/pagination';
	import Icon from '@iconify/svelte';
	import { siteConfig } from '$lib/config/site';
	import { spaCache } from '$lib/utils/spaCache';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	const posts = $derived(data.posts);

	let searchQuery = $state('');
	let searchDebounced = $state('');
	let searchIndex = $state<Array<{ title: string; link: string; description: string; content: string }>>([]);
	let searchLoaded = $state(false);

	let currentPage = $state(1);
	const postsPerPage = 10;

	let expandedCards = $state<Record<string, boolean>>({});

	let searchFilters = $state({
		title: true,
		description: true,
		content: true,
		path: true
	});

	let searchDebounceTimer: ReturnType<typeof setTimeout>;

	async function loadSearchIndex() {
		if (searchLoaded) return;
		searchIndex = await spaCache.get('search-index', async () => {
			const res = await fetch('/rss.xml');
			const text = await res.text();
			const xml = new DOMParser().parseFromString(text, 'text/xml');
			return Array.from(xml.querySelectorAll('item')).map(item => ({
				title: item.querySelector('title')?.textContent || '',
				link: item.querySelector('link')?.textContent || '',
				description: item.querySelector('description')?.textContent || '',
				content: item.querySelector('content\\:encoded, encoded')?.textContent || ''
			}));
		});
		searchLoaded = true;
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
		const MAX_MATCHES = 8;

		for (const line of lines) {
			if (matched.length >= MAX_MATCHES) break;
			const lower = line.toLowerCase();
			if (!terms.every((t) => lower.includes(t))) continue;
			const trimmed = line.trim();
			if (trimmed && !trimmed.startsWith('#') && trimmed.length > 10 && !trimmed.startsWith('<')) {
				matched.push(trimmed.substring(0, 200));
			}
		}
		return matched;
	}

	$effect(() => {
		clearTimeout(searchDebounceTimer);
		if (searchQuery.trim()) loadSearchIndex();
		searchDebounceTimer = setTimeout(() => {
			searchDebounced = searchQuery;
		}, 200);
		return () => clearTimeout(searchDebounceTimer);
	});

	let filteredPostsWithMatches = $derived.by(() => {
		if (!searchDebounced.trim()) return posts.map(p => ({ post: p, matchedLines: [] }));

		const hasAnyFilter = searchFilters.title || searchFilters.description || searchFilters.content || searchFilters.path;
		if (!hasAnyFilter) return [];

		const terms = parseQueryTerms(searchDebounced);
		if (terms.length === 0) return posts.map(p => ({ post: p, matchedLines: [] }));

		const results: Array<{ post: (typeof posts)[0]; matchedLines: string[] }> = [];
		const MAX_SEARCH_RESULTS = 100;

		for (const post of posts) {
			if (results.length >= MAX_SEARCH_RESULTS) break;
			const idx = searchIndex.find(rss => rss.link.includes(post.slug));
			if (!idx) continue;

			const title = idx.title.toLowerCase();
			const desc = idx.description.toLowerCase();
			const content = idx.content.toLowerCase();
			const slug_l = post.slug.toLowerCase();

			const allHit = terms.every((t) => {
				return (
					(searchFilters.title && title.includes(t)) ||
					(searchFilters.description && desc.includes(t)) ||
					(searchFilters.content && content.includes(t)) ||
					(searchFilters.path && slug_l.includes(t))
				);
			});
			if (!allHit) continue;

			const matchedLines = searchFilters.content && terms.every((t) => content.includes(t))
				? getMatchedContentLines(idx.content, searchDebounced)
				: [];
			results.push({ post, matchedLines });
		}

		return results;
	});

	let paginatedPosts = $derived.by(() => {
		const startIndex = (currentPage - 1) * postsPerPage;
		return filteredPostsWithMatches.slice(startIndex, startIndex + postsPerPage);
	});

	let totalPages = $derived(Math.ceil(filteredPostsWithMatches.length / postsPerPage));

	$effect(() => {
		searchDebounced;
		searchFilters.title;
		searchFilters.description;
		searchFilters.content;
		searchFilters.path;
		currentPage = 1;
		expandedCards = {};
	});

	let hasAnyFilter = $derived(searchFilters.title || searchFilters.description || searchFilters.content || searchFilters.path);

	let totalStats = $derived.by(() => {
		const totalWords = posts.reduce((sum, p) => sum + (p.stats?.wordCount ?? 0), 0);
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
</script>

<svelte:head>
	<title>文章列表 - {siteConfig.title}</title>
	<meta name="description" content="浏览所有文章" />
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-8 sm:py-12">
	<div class="mb-8 sm:mb-12 text-center">
		<h1 class="mb-4 text-3xl sm:text-4xl font-bold">文章列表</h1>
		<p class="text-muted-foreground">分享技术、想法和经验</p>
		<p class="mt-2 text-sm text-muted-foreground">
			共 {totalStats.totalPosts} 篇文章 · 总计 {totalStats.totalWords.toLocaleString()} 字
		</p>
	</div>

	<div class="mb-6 sm:mb-8">
		<Input
			type="text"
			bind:value={searchQuery}
			onfocus={loadSearchIndex}
			placeholder="搜索文章标题、描述或内容..."
			class="w-full"
		/>

		<div class="mt-3 flex flex-wrap gap-3 sm:gap-4">
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
				{:else if searchQuery !== searchDebounced}
					<p class="text-sm text-muted-foreground">搜索中...</p>
				{:else if filteredPostsWithMatches.length === 0}
					<p class="text-sm text-muted-foreground">未找到匹配的文章</p>
				{:else}
					<p class="text-sm text-muted-foreground">找到 {filteredPostsWithMatches.length} 篇文章</p>
				{/if}
			</div>
		{/if}
	</div>

	<div class="space-y-4 sm:space-y-6">
		{#each paginatedPosts as { post, matchedLines } (post.slug)}
			<a href="/posts/{post.slug}" class="block">
				<Card.Root class="group transition-all hover:shadow-lg">
					<Card.Content class="p-4 sm:p-6">
						<div class="flex flex-col gap-4 sm:flex-row">
							{#if post.metadata.image}
								<div class="sm:w-44 sm:flex-shrink-0">
									<img
										src={post.metadata.image}
										alt={post.metadata.title}
										class="h-40 sm:h-32 w-full rounded-md object-cover"
									/>
								</div>
							{/if}

							<div class="flex-1 min-w-0">
								<div class="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
									{#if post.metadata.pinned}
										<Badge class="shrink-0">置顶</Badge>
									{/if}
									<time class="shrink-0 text-sm text-muted-foreground">
										{formatDate(post.metadata.date || post.metadata.published)}
									</time>
									<span class="shrink-0 text-sm text-muted-foreground">· {post.stats.wordCount.toLocaleString()} 字</span>
									<span class="shrink-0 text-sm text-muted-foreground">· 约 {post.stats.readTime} 分钟</span>
								</div>

								<h2 class="mb-2 text-xl sm:text-2xl font-semibold group-hover:text-primary break-words">
									{@html highlightText(post.metadata.title, searchDebounced)}
								</h2>

								<p class="text-muted-foreground text-sm sm:text-base line-clamp-2">
									{@html highlightText(post.metadata.description, searchDebounced)}
								</p>

								{#if matchedLines.length > 0}
									{@const isExpanded = expandedCards[post.slug] ?? false}
									{@const displayLines = isExpanded ? matchedLines : matchedLines.slice(0, 2)}

									<div class="mt-3 space-y-1 border-l-2 border-primary/30 pl-3">
										{#each displayLines as line}
											<button
												type="button"
												onclick={(e) => {
													e.preventDefault();
													e.stopPropagation();
													window.open(`/posts/${post.slug}?highlight=${encodeURIComponent(searchQuery)}`, '_blank');
												}}
												class="block w-full text-left text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
											>
												<span class="inline-flex items-start gap-1.5">
													<Icon icon="mdi:arrow-right-thin" class="size-3.5 sm:size-4 flex-shrink-0 mt-0.5 opacity-50" />
													<span class="line-clamp-2">{@html highlightText(line, searchDebounced)}</span>
												</span>
											</button>
										{/each}
									</div>

									{#if matchedLines.length > 2}
										<button
											type="button"
											onclick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												expandedCards[post.slug] = !isExpanded;
											}}
											class="mt-1 text-xs text-primary hover:underline flex items-center gap-1"
										>
											<Icon icon={isExpanded ? 'mdi:chevron-up' : 'mdi:chevron-down'} class="size-3.5" />
											{isExpanded ? '收起' : `展开 (还有 ${matchedLines.length - 2} 条)`}
										</button>
									{/if}
								{/if}
							</div>
						</div>
					</Card.Content>
				</Card.Root>
			</a>
		{/each}
	</div>

	{#if paginatedPosts.length === 0 && !searchDebounced}
		<div class="py-12 text-center">
			<p class="text-muted-foreground">暂无文章</p>
		</div>
	{/if}

	{#if totalPages > 1}
		<div class="mt-8 flex flex-col items-center gap-3">
			<Pagination.Root count={filteredPostsWithMatches.length} perPage={postsPerPage} bind:page={currentPage}>
				{#snippet children({ pages })}
					<Pagination.Content>
						<Pagination.Item><Pagination.PrevButton /></Pagination.Item>
						{#each pages as page (page.key)}
							{#if page.type === 'ellipsis'}
								<Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
							{:else}
								<Pagination.Item><Pagination.Link {page} isActive={currentPage === page.value}>{page.value}</Pagination.Link></Pagination.Item>
							{/if}
						{/each}
						<Pagination.Item><Pagination.NextButton /></Pagination.Item>
					</Pagination.Content>
				{/snippet}
			</Pagination.Root>
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<span>第</span>
				<input
					type="number"
					min="1"
					max={totalPages}
					value={currentPage}
					onchange={(e) => {
						const v = parseInt((e.target as HTMLInputElement).value);
						if (v >= 1 && v <= totalPages) currentPage = v;
					}}
					class="h-7 w-14 rounded border bg-transparent px-1.5 text-center text-foreground outline-none focus:ring-1 focus:ring-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
				/>
				<span> / {totalPages} 页</span>
			</div>
		</div>
	{/if}
</div>
