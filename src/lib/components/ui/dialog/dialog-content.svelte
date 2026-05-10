<script lang="ts">
	import Icon from '@iconify/svelte';
	import { Dialog as DialogPrimitive } from "bits-ui";
	import DialogPortal from "./dialog-portal.svelte";
	import * as Dialog from "./index";
	import { cn, type WithoutChildrenOrChild } from "$lib/utils";
	import { Button } from "$lib/components/ui/button";
	let {
		ref = $bindable(null),
		class: className,
		children,
		...restProps
	}: WithoutChildrenOrChild<DialogPrimitive.ContentProps> & { children: any } = $props();
</script>
<DialogPortal>
	<Dialog.Overlay />
	<DialogPrimitive.Content
		bind:ref
		data-slot="dialog-content"
		class={cn("bg-popover text-popover-foreground ring-foreground/5 grid max-w-[calc(100%-2rem)] gap-6 rounded-4xl p-6 text-sm ring-1 sm:max-w-md fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 outline-none", className)}
		{...restProps}
	>
		{@render children?.()}
		<DialogPrimitive.Close data-slot="dialog-close">
			{#snippet child({ props })}
				<Button variant="ghost" class="absolute top-4 right-4" size="icon" {...props}>
					<Icon icon="mdi:close" />
					<span class="sr-only">Close</span>
				</Button>
			{/snippet}
		</DialogPrimitive.Close>
	</DialogPrimitive.Content>
</DialogPortal>
