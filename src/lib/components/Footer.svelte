<script lang="ts">
	import { siteConfig } from '$lib/config/site';
	import Icon from '@iconify/svelte';
</script>

<footer class="mt-16 border-t border-border">
	<div class="container mx-auto max-w-4xl px-4 py-10">
		<div class="grid gap-8 sm:grid-cols-3">
			<div class="flex flex-col gap-3">
				<h3 class="text-sm font-semibold text-foreground">关于</h3>
				<p class="text-sm text-muted-foreground leading-relaxed">{siteConfig.bio.bio}</p>
				<p class="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} {siteConfig.bio.name}</p>
			</div>

			<div class="flex flex-col gap-3">
				<h3 class="text-sm font-semibold text-foreground">联系</h3>
				<div class="flex flex-wrap gap-2">
					{#each siteConfig.bio.links as link}
						<a
							href={link.url}
							target="_blank"
							rel="noopener noreferrer"
							aria-label={link.name}
							class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
						>
							<Icon icon={link.icon} class="w-4 h-4" style={link.color ? `color: ${link.color}` : ''} />
							{link.name}
						</a>
					{/each}
				</div>
			</div>

			<div class="flex flex-col gap-3">
				<h3 class="text-sm font-semibold text-foreground">站点</h3>
				<div class="flex flex-wrap gap-2">
					<a href="/posts" class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><Icon icon="mdi:post-outline" class="w-4 h-4" />博客</a>
					<a href="/cover" class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><Icon icon="mdi:image-edit" class="w-4 h-4" />封面制作</a>
					<a href="/ptg" class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><Icon icon="mdi:layers-triple" class="w-4 h-4" />隐藏图</a>
					<a href="/friends" class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><Icon icon="mdi:link-variant" class="w-4 h-4" />友链</a>
					<a href="/rss.xml" class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"><Icon icon="mdi:rss" class="w-4 h-4" />RSS</a>
					<a
						href="#"
						id="open_preferences_center"
						class="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
					>
						<Icon icon="mdi:cookie-settings" class="w-4 h-4" />
						Cookie 设置
					</a>
				</div>
			</div>
		</div>

		<div class="mt-8 pt-6 border-t border-border/60">
			<p class="text-center text-xs text-muted-foreground">
				Powered by <a href="https://svelte.dev" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 hover:text-foreground">SvelteKit</a>
				&middot; Hosted on <a href="https://workers.cloudflare.com" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 hover:text-foreground">Cloudflare</a>
			</p>
		</div>
	</div>
</footer>
