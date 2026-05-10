<script lang="ts">
	import '../app.css';
	import { page } from '$app/stores';
	import { onNavigate } from '$app/navigation';
	import { siteConfig } from '$lib/config/site';
	import BackToTop from '$lib/components/BackToTop.svelte';
	import NavBar from '$lib/components/NavBar.svelte';
	import Footer from '$lib/components/Footer.svelte';

	let { children } = $props();

	let isPostDetail = $derived(/^\/posts\/[^/]+\/?$/.test($page.url.pathname));

	onNavigate((navigation) => {
		if (!document.startViewTransition) return;

		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<title>{siteConfig.title}</title>
	<link rel="icon" href={siteConfig.icon} />
	<meta name="description" content={siteConfig.description} />
	<meta name="keywords" content={siteConfig.keywords.join(', ')} />
	<meta property="og:site_name" content={siteConfig.title} />
	<meta property="og:locale" content={siteConfig.lang} />
	{#if !isPostDetail}
		<meta property="og:type" content="website" />
		<meta property="og:url" content={siteConfig.url} />
		<meta property="og:title" content={siteConfig.title} />
		<meta property="og:description" content={siteConfig.description} />
		<meta property="og:image" content="{siteConfig.url}{siteConfig.ogImage}" />
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={siteConfig.title} />
		<meta name="twitter:description" content={siteConfig.description} />
		<meta name="twitter:image" content="{siteConfig.url}{siteConfig.ogImage}" />
	{/if}
	<link rel="canonical" href="{siteConfig.url}{$page.url.pathname}" />
	<link rel="alternate" type="application/rss+xml" title="{siteConfig.title} RSS Feed" href="/rss.xml" />
</svelte:head>

<NavBar />

{@render children()}

<Footer />

<BackToTop />
