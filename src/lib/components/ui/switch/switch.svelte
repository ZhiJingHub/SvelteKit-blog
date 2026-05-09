<script lang="ts">
	import { Switch as SwitchPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils.ts";

	let {
		ref = $bindable(null),
		class: className,
		checked = $bindable(false),
		...restProps
	}: WithoutChildrenOrChild<SwitchPrimitive.RootProps> = $props();
</script>

<SwitchPrimitive.Root
	bind:ref
	bind:checked
	data-slot="switch"
	class={cn(
		"data-checked:bg-primary data-unchecked:bg-input focus-visible:border-ring focus-visible:ring-ring/50 shrink-0 rounded-full border border-transparent focus-visible:ring-[3px] h-[18.4px] w-[32px] peer relative inline-flex items-center transition-all outline-none disabled:opacity-50",
		className
	)}
	{...restProps}
>
	<SwitchPrimitive.Thumb
		data-slot="switch-thumb"
		class="bg-background rounded-full size-4 data-checked:translate-x-[calc(100%-2px)] data-unchecked:translate-x-0 pointer-events-none block ring-0 transition-transform"
	/>
</SwitchPrimitive.Root>
