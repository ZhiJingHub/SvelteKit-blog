<script lang="ts">
	import CoverGenerator from '$lib/components/CoverGenerator.svelte';
	import { siteConfig } from '$lib/config/site';
</script>

<svelte:head>
	<title>封面制作 - {siteConfig.title}</title>
</svelte:head>

<div class="mb-6">
	<h1 class="text-2xl font-bold">封面制作</h1>
	<p class="text-sm text-muted-foreground mt-1">在线生成精美的封面图片</p>
</div>

<CoverGenerator />
