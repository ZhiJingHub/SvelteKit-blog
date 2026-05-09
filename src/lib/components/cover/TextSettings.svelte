<script lang="ts">
	import { onMount } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';

	let {
		leftText = $bindable(), rightText = $bindable(), fontWeight = $bindable(), customFontName = $bindable(),
		onFontUpload, onRemoveFont, onSystemFontSelect
	}: {
		leftText: string; rightText: string; fontWeight: number; customFontName: string;
		onFontUpload: (e: Event) => void; onRemoveFont: () => void; onSystemFontSelect: (fontName: string) => void;
	} = $props();

	let systemFonts = $state<string[]>([]);
	let fontSearchQuery = $state('');
	let isLoadingFonts = $state(false);
	let currentPage = $state(1);
	const FONTS_PER_PAGE = 20;

	let filteredFonts = $derived(systemFonts.filter(f => f.toLowerCase().includes(fontSearchQuery.toLowerCase())));
	let totalPages = $derived(Math.ceil(filteredFonts.length / FONTS_PER_PAGE));
	let paginatedFonts = $derived(filteredFonts.slice((currentPage - 1) * FONTS_PER_PAGE, currentPage * FONTS_PER_PAGE));

	$effect(() => { fontSearchQuery; currentPage = 1; });

	async function loadSystemFonts() {
		if (!('queryLocalFonts' in window)) return;
		isLoadingFonts = true;
		try {
			const fonts = await (window as any).queryLocalFonts();
			const names = new Set<string>();
			fonts.forEach((f: any) => names.add(f.family));
			systemFonts = Array.from(names).sort();
		} catch { /* ignore */ }
		isLoadingFonts = false;
	}
</script>

<Card>
	<CardHeader><CardTitle>文本设置</CardTitle></CardHeader>
	<CardContent class="space-y-4">
		<div class="space-y-2"><Label>左侧文字</Label><Input bind:value={leftText} /></div>
		<div class="space-y-2"><Label>右侧文字</Label><Input bind:value={rightText} /></div>
		<div class="space-y-2"><Label>字体粗细: {fontWeight}</Label><Slider value={[fontWeight]} onValueChange={(v) => (fontWeight = v[0])} min={100} max={900} step={100} /></div>
		<div class="pt-4 border-t space-y-4">
			<Label>自定义字体</Label>
			<div>
				<input type="file" accept=".ttf,.otf,.woff,.woff2" onchange={onFontUpload} class="hidden" id="font-upload" />
				<Label for="font-upload" class="flex items-center justify-center w-full h-16 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary">
					<div class="flex flex-col items-center gap-1 text-muted-foreground">
						<Icon icon="mdi:font-download" class="h-5 w-5" />
						<span class="text-xs">{customFontName || '点击上传字体'}</span>
					</div>
				</Label>
				{#if customFontName}
					<Button variant="outline" size="sm" class="mt-2" onclick={onRemoveFont}>移除字体</Button>
				{/if}
			</div>
			<div class="space-y-2">
				<div class="flex items-center justify-between">
					<Label>系统字体</Label>
					{#if systemFonts.length === 0}
						<Button variant="outline" size="sm" onclick={loadSystemFonts} disabled={isLoadingFonts}>
							{#if isLoadingFonts}<Icon icon="mdi:loading" class="mr-2 h-4 w-4 animate-spin" />加载中...{:else}<Icon icon="mdi:folder-open" class="mr-2 h-4 w-4" />获取系统字体{/if}
						</Button>
					{/if}
				</div>
				{#if systemFonts.length > 0}
					<Input bind:value={fontSearchQuery} placeholder="搜索字体..." class="h-9" />
					<div class="max-h-48 overflow-y-auto border rounded-lg">
						<div class="divide-y">
							{#each paginatedFonts as font}
								<button onclick={() => onSystemFontSelect(font)} class="w-full px-3 py-2 text-left hover:bg-accent transition-colors {customFontName === font ? 'bg-primary/10 font-medium' : ''}" style="font-family: '{font}', sans-serif;">{font}</button>
							{/each}
						</div>
					</div>
					{#if totalPages > 1}
						<div class="flex items-center justify-between text-sm">
							<Button variant="ghost" size="sm" disabled={currentPage === 1} onclick={() => (currentPage--)}>上一页</Button>
							<span class="text-muted-foreground">{currentPage} / {totalPages}</span>
							<Button variant="ghost" size="sm" disabled={currentPage === totalPages} onclick={() => (currentPage++)}>下一页</Button>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	</CardContent>
</Card>
