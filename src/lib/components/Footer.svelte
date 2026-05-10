<script lang="ts">
	import { siteConfig } from '$lib/config/site';
</script>

<footer class="mt-8 border-t pt-6 pb-8">
	<div class="container mx-auto flex flex-col items-center gap-2 text-sm text-muted-foreground">
		<p>&copy; {new Date().getFullYear()} {siteConfig.bio.name}</p>
	</div>
</footer>
