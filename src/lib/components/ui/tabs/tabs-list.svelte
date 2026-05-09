<script lang="ts">
	import { Tabs as TabsPrimitive } from "bits-ui";
	import { cn } from "$lib/utils.ts";

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: TabsPrimitive.ListProps = $props();
</script>

<TabsPrimitive.List
	bind:ref
	data-slot="tabs-list"
	class={cn("rounded-4xl p-[3px] h-9 bg-muted text-muted-foreground inline-flex w-fit items-center justify-center", className)}
	{...restProps}
/>
