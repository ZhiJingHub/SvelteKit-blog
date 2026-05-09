<script lang="ts">
	import { tick, onMount } from 'svelte';
	import { page } from '$app/stores';
	import { siteConfig } from '$lib/config/site';
	import ImageViewer from '$lib/components/ImageViewer.svelte';
	import PostToc from '$lib/components/PostToc.svelte';
	import { highlightCodeBlocksIn } from '$lib/utils/highlight';
	import { renderMermaidIn } from '$lib/utils/mermaid';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let proseEl: HTMLDivElement | undefined = $state();

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
		void data.component;
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

<article class="container mx-auto max-w-5xl px-4 py-12">
	<div class="mb-8">
		<a href="/posts">
			<button class="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium border border-border hover:bg-accent transition-colors">
				← 返回文章列表
			</button>
		</a>
	</div>

	<div class="flex gap-8">
		<div class="flex-1 min-w-0">
			<header class="mb-8">
				<div class="mb-4 flex items-center gap-2">
					{#if data.post.metadata.pinned}
						<span class="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
							置顶
						</span>
					{/if}
					<time class="text-sm text-muted-foreground">
						{formatDate(data.post.metadata.published)}
					</time>
					{#if data.post.metadata.updated}
						<span class="text-sm text-muted-foreground">· 更新于 {formatDate(data.post.metadata.updated)}</span>
					{/if}
				</div>

				<h1 class="mb-4 text-4xl font-bold">{data.post.metadata.title}</h1>

				<p class="text-lg text-muted-foreground">
					{data.post.metadata.description}
				</p>
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
					prose-pre:bg-muted prose-pre:border prose-pre:border-border prose-pre:rounded-lg
					prose-img:rounded-lg
					prose-table:border prose-table:border-border prose-th:border prose-th:border-border prose-th:bg-muted prose-th:p-2 prose-td:border prose-td:border-border prose-td:p-2
					prose-hr:border-border
					prose-li:text-foreground
				"
			>
				<data.component />
			</div>
		</div>

		<aside class="hidden xl:block w-56 shrink-0">
			<div class="sticky top-20">
				<PostToc container={proseEl} />
			</div>
		</aside>
	</div>
</article>

<ImageViewer container={proseEl} />
