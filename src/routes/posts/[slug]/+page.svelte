<script lang="ts">
	import { tick } from 'svelte';
	import type { Component } from 'svelte';
	import { page } from '$app/stores';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { siteConfig } from '$lib/config/site';
	import ImageViewer from '$lib/components/ImageViewer.svelte';
	import PostToc from '$lib/components/PostToc.svelte';
	import PageViews from '$lib/components/PageViews.svelte';
	import { highlightCodeBlocksIn } from '$lib/utils/highlight';
	import { renderMermaidIn } from '$lib/utils/mermaid';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let proseEl: HTMLDivElement | undefined = $state();

	let PostContent = $derived(data.component as Component);

	function formatDate(dateString: string) {
		const date = new Date(dateString);
		return date.toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
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

	function highlightSearchTerms(container: HTMLElement, query: string) {
		const terms = parseQueryTerms(query);
		if (terms.length === 0) return;

		const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
			acceptNode: (node) => {
				const parent = node.parentElement;
				if (!parent) return NodeFilter.FILTER_REJECT;
				if (
					parent.tagName === 'MARK' ||
					parent.tagName === 'SCRIPT' ||
					parent.tagName === 'STYLE' ||
					parent.closest('pre, code')
				) {
					return NodeFilter.FILTER_REJECT;
				}
				return NodeFilter.FILTER_ACCEPT;
			}
		});

		const textNodes: Text[] = [];
		let node: Node | null;
		while ((node = walker.nextNode())) textNodes.push(node as Text);

		const escaped = terms
			.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
			.sort((a, b) => b.length - a.length);
		const regex = new RegExp(`(${escaped.join('|')})`, 'gi');

		for (const textNode of textNodes) {
			const text = textNode.textContent || '';
			if (!regex.test(text)) continue;
			regex.lastIndex = 0;

			const frag = document.createDocumentFragment();
			let lastIdx = 0;
			let match: RegExpExecArray | null;
			while ((match = regex.exec(text)) !== null) {
				if (match.index > lastIdx) {
					frag.appendChild(document.createTextNode(text.slice(lastIdx, match.index)));
				}
				const mark = document.createElement('mark');
				mark.className = 'bg-yellow-200 dark:bg-yellow-800 search-highlight';
				mark.textContent = match[0];
				frag.appendChild(mark);
				lastIdx = regex.lastIndex;
			}
			if (lastIdx < text.length) {
				frag.appendChild(document.createTextNode(text.slice(lastIdx)));
			}
			textNode.replaceWith(frag);
		}
	}

	function scrollToFirstMatch() {
		const firstMark = proseEl?.querySelector('mark.search-highlight');
		if (firstMark) {
			const top = (firstMark as HTMLElement).getBoundingClientRect().top + window.scrollY - 100;
			window.scrollTo({ top, behavior: 'smooth' });
		}
	}

	$effect(() => {
		void PostContent;
		void $page.url;
		(async () => {
			await tick();
			if (!proseEl) return;
			await renderMermaidIn(proseEl);
			highlightCodeBlocksIn(proseEl);

			const highlight = $page.url.searchParams.get('highlight');
			if (highlight) {
				highlightSearchTerms(proseEl, highlight);
				setTimeout(scrollToFirstMatch, 100);
			}
		})();
	});
</script>

<svelte:head>
	<title>{data.post.metadata.title} - {siteConfig.title}</title>
	<meta name="description" content={data.post.metadata.description} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={data.post.metadata.title} />
	<meta property="og:description" content={data.post.metadata.description} />
	<meta property="og:url" content="{siteConfig.url}/posts/{$page.params.slug}/" />
	{#if data.post.metadata.image}
		<meta
			property="og:image"
			content={data.post.metadata.image.startsWith('http')
				? data.post.metadata.image
				: `${siteConfig.url}${data.post.metadata.image}`}
		/>
		<meta name="twitter:card" content="summary_large_image" />
		<meta
			name="twitter:image"
			content={data.post.metadata.image.startsWith('http')
				? data.post.metadata.image
				: `${siteConfig.url}${data.post.metadata.image}`}
		/>
	{/if}
	<meta name="twitter:title" content={data.post.metadata.title} />
	<meta name="twitter:description" content={data.post.metadata.description} />
</svelte:head>

<article class="container mx-auto max-w-3xl px-4 py-8 sm:py-12">
	<div class="mb-6 sm:mb-8">
		<a href="/posts">
			<Button variant="ghost" size="sm" class="sm:size-default">← 返回文章列表</Button>
		</a>
	</div>

	<header class="mb-6 sm:mb-8">
		<div class="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
			{#if data.post.metadata.pinned}
				<Badge>置顶</Badge>
			{/if}
			<time class="text-xs sm:text-sm text-muted-foreground">
				{formatDate(data.post.metadata.published)}
			</time>
			<span class="text-xs sm:text-sm text-muted-foreground">· {data.stats.wordCount.toLocaleString()} 字</span>
			<span class="text-xs sm:text-sm text-muted-foreground">· 约 {data.stats.readTime} 分钟</span>
			{#if data.post.metadata.updated}
				<span class="text-xs sm:text-sm text-muted-foreground">· 更新于 {formatDate(data.post.metadata.updated)}</span>
			{/if}
			<PageViews pathname="/posts/{data.slug}/" class="text-xs sm:text-sm text-muted-foreground" />
		</div>

		<h1 class="mb-4 text-2xl sm:text-3xl md:text-4xl font-bold">{data.post.metadata.title}</h1>

		<p class="text-base sm:text-lg text-muted-foreground">
			{data.post.metadata.description}
		</p>

		{#if data.post.metadata.image}
			<div class="mt-6">
				<img
					src={data.post.metadata.image}
					alt={data.post.metadata.title}
					class="w-full rounded-lg object-cover"
				/>
			</div>
		{/if}
	</header>

	<div
		bind:this={proseEl}
		class="prose prose-neutral dark:prose-invert max-w-none break-words [overflow-wrap:anywhere]
			prose-headings:text-foreground
			prose-p:text-foreground
			prose-strong:text-foreground
			prose-a:text-primary prose-a:underline prose-a:underline-offset-4 prose-a:break-all hover:prose-a:opacity-80
			prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
			prose-code:bg-muted prose-code:text-foreground prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:before:content-none prose-code:after:content-none
			prose-pre:bg-transparent prose-pre:p-0 prose-pre:text-foreground prose-pre:overflow-x-auto
			prose-hr:border-border
			prose-th:border prose-th:border-border prose-th:bg-muted
			prose-td:border prose-td:border-border
			prose-img:rounded-lg"
	>
		<PostContent />
	</div>

	<PostToc container={proseEl} trigger={PostContent} />

	<footer class="mt-12 border-t pt-8">
		<div class="flex justify-center">
			<a href="/posts">
				<Button>← 返回文章列表</Button>
			</a>
		</div>
	</footer>
</article>

<ImageViewer />
