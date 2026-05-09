<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { siteConfig } from '$lib/config/site';
	import Icon from '@iconify/svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
</script>

<svelte:head>
	<title>{siteConfig.title}</title>
</svelte:head>

<div class="flex min-h-screen flex-col items-center justify-center gap-6 px-4 py-12">
	<div class="fixed top-4 right-4 z-50">
		<ThemeToggle />
	</div>

	<img src={siteConfig.bio.avatar} alt="Avatar" class="h-32 w-32 rounded-full" />

	<div class="text-center">
		<h1 class="text-4xl font-bold mb-2">{siteConfig.bio.name}</h1>
		<p class="text-lg text-muted-foreground mb-4">{siteConfig.bio.bio}</p>
	</div>

	<div class="flex flex-wrap gap-3 justify-center">
		{#each siteConfig.bio.links as link}
			{@const isLocalImage = link.icon.startsWith('/')}
			<a href={link.url} target="_blank" rel="noopener noreferrer">
				<Button variant="outline" class="flex items-center gap-2">
					{#if isLocalImage}
						<img src={link.icon} alt={link.name} class="w-5 h-5" />
					{:else}
						<Icon
							icon={link.icon}
							class="w-5 h-5"
							style={link.color ? `color: ${link.color}` : ''}
						/>
					{/if}
					<span class="text-sm font-medium">{link.name}</span>
				</Button>
			</a>
		{/each}
	</div>

	<Separator class="max-w-xs" />

	<div class="flex flex-wrap gap-3 justify-center">
		{#each siteConfig.navLinks as link}
			{@const isExternal = link.href.startsWith('http')}
			<a href={link.href} {...isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {}}>
				<Button
					variant="outline"
					class="flex items-center gap-2"
				>
					<Icon icon={link.icon} class="w-5 h-5" />
					{link.label}
				</Button>
			</a>
		{/each}
	</div>
</div>
