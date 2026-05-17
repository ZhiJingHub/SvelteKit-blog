<script lang="ts">
	import CoverGenerator from '$lib/components/CoverGenerator.svelte';
	import PageViews from '$lib/components/PageViews.svelte';
	import { siteConfig } from '$lib/config/site';
</script>

<svelte:head>
	<title>封面制作 - {siteConfig.title}</title>
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">封面制作</h1>
		<PageViews pathname="/cover/" class="text-sm text-muted-foreground" />
	</div>
	<CoverGenerator />
</div>
