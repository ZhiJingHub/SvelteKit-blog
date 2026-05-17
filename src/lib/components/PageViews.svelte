<script lang="ts">
	import { onMount } from 'svelte';
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { browser } from '$app/environment';

	let {
		pathname,
		class: className = '',
		prefix = '',
		suffix = '次浏览',
		increment = true
	}: {
		pathname: string;
		class?: string;
		prefix?: string;
		suffix?: string;
		increment?: boolean;
	} = $props();

	let count = $state<number | null>(null);

	onMount(async () => {
		if (!browser) return;

		const key = pathname.replace(/\/$/, '') || '/';

		if (increment) {
			try {
				const res = await fetch('/api/views', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ path: key })
				});
				if (res.ok) {
					const data = await res.json();
					count = data.count || 0;
				}
			} catch {
				count = 0;
			}
		} else {
			try {
				const res = await fetch(`/api/views?paths=${encodeURIComponent(key)}`);
				if (res.ok) {
					const data = await res.json();
					count = data[0] || 0;
				}
			} catch {
				count = 0;
			}
		}
	});
</script>

{#if count !== null}
	<span class={className} transition:fly={{ y: 8, duration: 350, easing: quintOut }}>
		{prefix}{count.toLocaleString()}{suffix}
	</span>
{/if}
