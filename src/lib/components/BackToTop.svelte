<script lang="ts">
	import { fly } from 'svelte/transition';
	import Icon from '@iconify/svelte';
	import { tocFloating } from '$lib/stores/toc-floating';

	const tocAvailable = tocFloating.available;

	let scrollY = $state(0);
	let showButton = $derived(scrollY > 100);

	let isTocOpen = $state(false);
	$effect(() => { isTocOpen = $tocFloating; });

	const scrollToTop = () => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};
</script>

<svelte:window bind:scrollY />

<div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
	{#if $tocAvailable}
		<div transition:fly={{ y: 20, duration: 300 }} class="xl:hidden">
			<button
				onclick={() => tocFloating.toggle()}
				aria-label="目录"
				aria-expanded={isTocOpen}
				class="inline-flex items-center justify-center rounded-md w-12 h-12 shadow-lg hover:shadow-xl bg-white text-black dark:bg-black dark:text-white border-2 border-border transition-colors"
			>
				<Icon
					icon={isTocOpen ? 'mdi:close' : 'mdi:format-list-bulleted'}
					class="w-5 h-5"
				/>
			</button>
		</div>
	{/if}

	{#if showButton}
		<div transition:fly={{ y: 20, duration: 300 }}>
			<button
				onclick={scrollToTop}
				aria-label="回到顶部"
				class="inline-flex items-center justify-center rounded-md w-12 h-12 shadow-lg hover:shadow-xl bg-white text-black dark:bg-black dark:text-white border-2 border-border transition-colors"
			>
				<Icon icon="mdi:chevron-up" class="w-5 h-5" />
			</button>
		</div>
	{/if}
</div>
