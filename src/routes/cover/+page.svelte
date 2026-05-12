<script lang="ts">
	import { onMount } from 'svelte';
	import { siteConfig } from '$lib/config/site';

	let CoverGenerator = $state<any>(null);
	let loading = $state(true);

	onMount(async () => {
		const mod = await import('$lib/components/CoverGenerator.svelte');
		CoverGenerator = mod.default;
		loading = false;
	});
</script>

<svelte:head>
	<title>封面制作 - {siteConfig.title}</title>
</svelte:head>

<div class="container mx-auto max-w-[1920px] px-4 py-8">
	<div class="mb-6">
		<h1 class="text-3xl font-bold mb-2">封面制作</h1>
		<p class="text-muted-foreground">在线生成精美的封面图片</p>
	</div>
	{#if loading}
		<div class="space-y-6 animate-pulse">
			<div class="flex flex-col lg:flex-row gap-6">
				<div class="flex-1 lg:max-w-[55%] h-[600px] bg-muted rounded-xl"></div>
				<div class="w-full lg:flex-1">
					<div class="hidden lg:grid lg:grid-cols-3 gap-6">
						{#each Array(3) as _}
							<div class="space-y-6">
								{#each Array(3) as _}
									<div class="h-48 bg-muted rounded-xl"></div>
								{/each}
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	{:else if CoverGenerator}
		<CoverGenerator />
	{/if}
</div>
