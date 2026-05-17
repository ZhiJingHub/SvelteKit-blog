<script lang="ts">
	import CoverGenerator from '$lib/components/CoverGenerator.svelte';
	import { siteConfig } from '$lib/config/site';
</script>

<svelte:head>
	<title>封面制作 - {siteConfig.title}</title>
</svelte:head>

<CoverGenerator />
