<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.ts";

	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { size?: "default" | "sm" } = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	class={cn("ring-foreground/10 bg-card text-card-foreground gap-6 overflow-hidden rounded-2xl text-sm ring-1 py-6 group/card flex flex-col", className)}
	{...restProps}
>
	{@render children?.()}
</div>
