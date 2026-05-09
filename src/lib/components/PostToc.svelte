<script lang="ts">
	import Icon from '@iconify/svelte';
	import { tocFloating } from '$lib/stores/toc-floating';

	let { container }: { container: HTMLDivElement | undefined } = $props();

	let headings = $state<Array<{ level: number; id: string; text: string }>>([]);
	let activeId = $state('');

	function extractHeadings() {
		if (!container) {
			headings = [];
			return;
		}
		const result: Array<{ level: number; id: string; text: string }> = [];
		const hs = container.querySelectorAll('h2, h3, h4');
		hs.forEach((h) => {
			const level = parseInt(h.tagName[1]);
			if (!h.id) {
				h.id = `h-${h.textContent?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '') || Math.random().toString(36).slice(2, 7)}`;
			}
			result.push({ level, id: h.id, text: h.textContent || '' });
		});
		headings = result;
		tocFloating.setAvailable(result.length > 0);
	}

	function onScroll() {
		const hs = container?.querySelectorAll('h2[id], h3[id], h4[id]');
		if (!hs || hs.length === 0) return;

		let closest = '';
		hs.forEach((h, i) => {
			const rect = (h as HTMLElement).getBoundingClientRect();
			if (rect.top <= 120) {
				closest = h.id;
			}
		});

		// 滚动到底部时高亮最后一个
		if (!closest) {
			const last = hs[hs.length - 1] as HTMLElement;
			const lastRect = last.getBoundingClientRect();
			if (lastRect.top < 0) {
				closest = last.id;
			}
		}

		activeId = closest;
	}

	$effect(() => {
		// container 可能异步出现，等待一个微任务
		void Promise.resolve().then(() => extractHeadings());
	});

	let handleScroll = () => {};

	$effect(() => {
		window.removeEventListener('scroll', handleScroll);
		if (container) {
			handleScroll = () => onScroll();
			window.addEventListener('scroll', handleScroll, { passive: true });
			onScroll();
		}
		return () => window.removeEventListener('scroll', handleScroll);
	});
</script>

{#if headings.length > 0}
	<div class="flex flex-col gap-1">
		<div class="flex items-center gap-2 mb-2">
			<Icon icon="mdi:format-list-bulleted" class="w-4 h-4 text-muted-foreground" />
			<span class="text-sm font-medium text-muted-foreground">目录</span>
		</div>
		<nav class="flex flex-col gap-0.5">
			{#each headings as heading (heading.id)}
				<a
					href="#{heading.id}"
					class="block py-1 text-sm transition-colors hover:text-foreground truncate"
					class:text-primary={heading.id === activeId}
					class:text-muted-foreground={heading.id !== activeId}
					class:pl-0={heading.level === 2}
					class:pl-4={heading.level === 3}
					class:pl-8={heading.level === 4}
					class:font-medium={heading.id === activeId}
				>
					{heading.text}
				</a>
			{/each}
		</nav>
	</div>
{/if}
