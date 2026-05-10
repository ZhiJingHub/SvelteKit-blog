<script lang="ts">
	import Icon from '@iconify/svelte';
	import { Checkbox as CheckboxPrimitive } from "bits-ui";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils";

	let {
		ref = $bindable(null),
		checked = $bindable(false),
		indeterminate = $bindable(false),
		class: className,
		...restProps
	}: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props();
</script>

<CheckboxPrimitive.Root
	bind:ref
	data-slot="checkbox"
	class={cn(
		"border-input dark:bg-input/30 data-checked:bg-primary data-checked:text-primary-foreground dark:data-checked:bg-primary data-checked:border-primary aria-invalid:border-destructive focus-visible:border-ring focus-visible:ring-ring/50 flex size-4 items-center justify-center rounded-[6px] border transition-shadow focus-visible:ring-[3px] peer shrink-0 outline-none disabled:cursor-not-allowed disabled:opacity-50",
		className
	)}
	bind:checked
	bind:indeterminate
	{...restProps}
>
	{#snippet children({ checked, indeterminate })}
		<div data-slot="checkbox-indicator" class="[&>svg]:size-3.5 grid place-content-center text-current transition-none">
			{#if checked}
				<Icon icon="mdi:check" />
			{:else if indeterminate}
				<Icon icon="mdi:minus" />
			{/if}
		</div>
	{/snippet}
</CheckboxPrimitive.Root>
