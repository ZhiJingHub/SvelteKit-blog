<script lang="ts">
	import { Slider as SliderPrimitive } from "bits-ui";
	import { cn } from "$lib/utils";
	import type { ClassValue } from "clsx";

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		...restProps
	}: {
		ref?: HTMLSpanElement | null;
		value?: number | number[];
		class?: ClassValue;
		[key: string]: unknown;
	} = $props();
</script>

<SliderPrimitive.Root
	bind:ref
	bind:value={value as never}
	type="single"
	data-slot="slider"
	class={cn(
		"relative flex w-full touch-none items-center select-none data-disabled:opacity-50",
		className
	)}
	{...restProps}
>
	{#snippet children({ thumbItems })}
		<span
			data-slot="slider-track"
			class="bg-muted rounded-4xl h-3 w-full relative grow overflow-hidden"
		>
			<SliderPrimitive.Range
				data-slot="slider-range"
				class="bg-primary absolute h-full"
			/>
		</span>
		{#each thumbItems as thumb (thumb)}
			<SliderPrimitive.Thumb
				data-slot="slider-thumb"
				index={thumb.index}
				class="border-primary ring-ring/50 size-4 rounded-4xl border bg-white shadow-sm transition-colors hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden block shrink-0"
			/>
		{/each}
	{/snippet}
</SliderPrimitive.Root>
