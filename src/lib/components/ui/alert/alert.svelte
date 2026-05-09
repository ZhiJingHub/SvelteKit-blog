<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.ts";

	let {
		ref = $bindable(null),
		class: className,
		variant = "default",
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { variant?: "default" | "destructive" } = $props();
</script>

<div
	bind:this={ref}
	data-slot="alert"
	role="alert"
	class={cn(
		"grid gap-0.5 rounded-lg border px-4 py-3 text-left text-sm",
		variant === "destructive" ? "text-destructive bg-card" : "bg-card text-card-foreground",
		className
	)}
	{...restProps}
>
	{@render children?.()}
</div>
