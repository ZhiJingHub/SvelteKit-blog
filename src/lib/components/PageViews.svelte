<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { spaCache } from '$lib/utils/spaCache';

	let {
		pathname,
		class: className = '',
		prefix = '',
		suffix = '次浏览'
	}: {
		pathname: string;
		class?: string;
		prefix?: string;
		suffix?: string;
	} = $props();

	let count = $state<number | null>(null);

	onMount(async () => {
		const key = `pageviews-${pathname}`;
		count = await spaCache.get(key, async () => {
			const res = await fetch('/api/views', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify([pathname])
			});
			if (!res.ok) return 0;
			const data = (await res.json()) as number[];
			return data[0] || 0;
		});
	});
</script>

{#if count !== null}
	<span class={className} transition:fly={{ y: 8, duration: 350, easing: quintOut }}>
		{prefix}{count.toLocaleString()} {suffix}
	</span>
{/if}
