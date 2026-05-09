<script lang="ts">
	import { siteConfig } from '$lib/config/site';
	import Icon from '@iconify/svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
</script>

<svelte:head>
	<title>{siteConfig.title}</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center gap-6 px-4">
	<div class="fixed top-4 right-4 z-50">
		<ThemeToggle />
	</div>

	<img src={siteConfig.bio.avatar} alt="Avatar" class="h-32 w-32 rounded-full" />

	<div class="text-center">
		<h1 class="text-4xl font-bold mb-2">{siteConfig.bio.name}</h1>
		<p class="text-lg text-muted-foreground mb-4">{siteConfig.bio.bio}</p>
	</div>

	<div class="flex gap-4 mt-4">
		{#each siteConfig.bio.links as link}
			<a
				href={link.url}
				target="_blank"
				rel="noopener noreferrer"
				class="flex items-center gap-2 px-4 py-2 rounded-lg bg-card border border-border hover:bg-accent transition-colors"
			>
				<Icon icon={link.icon} class="w-5 h-5" style={link.color ? `color: ${link.color}` : ''} />
				<span class="text-sm">{link.name}</span>
			</a>
		{/each}
	</div>

	<div class="mt-8 flex gap-4">
		<a href="/posts" class="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
			阅读博客
		</a>
	</div>
</div>
