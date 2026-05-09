<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';

	let {
		ratios = $bindable(), exportConfig = $bindable(), activeRatios, onExport
	}: {
		ratios: Array<{ label: string; w: number; h: number; checked: boolean }>;
		exportConfig: { format: 'png' | 'svg'; scales: number[]; filename: string; transparentBg: boolean; exportRatios: string[] };
		activeRatios: Array<{ label: string; w: number; h: number; checked: boolean }>;
		canvasWidth: number; canvasHeight: number; onExport: () => void;
	} = $props();
</script>

<Card>
	<CardHeader><CardTitle>画板比例</CardTitle></CardHeader>
	<CardContent>
		<div class="grid grid-cols-2 gap-2">
			{#each ratios as ratio}
				<label class="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-accent">
					<Checkbox bind:checked={ratio.checked} />
					<span class="font-mono">{ratio.label}</span>
				</label>
			{/each}
		</div>
	</CardContent>
</Card>

{#if exportConfig.format === 'png'}
	<Card>
		<CardHeader><CardTitle>缩放倍率</CardTitle></CardHeader>
		<CardContent>
			<div class="grid grid-cols-2 gap-2">
				{#each [1, 2, 3, 4] as scale}
					<label class="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-accent">
						<Checkbox checked={exportConfig.scales.includes(scale)} onCheckedChange={(checked) => { exportConfig.scales = checked ? [...exportConfig.scales, scale].sort() : exportConfig.scales.filter(s => s !== scale); }} />
						<span class="font-mono">{scale}x</span>
					</label>
				{/each}
			</div>
		</CardContent>
	</Card>
{/if}

<Card>
	<CardHeader><CardTitle>导出选项</CardTitle></CardHeader>
	<CardContent class="space-y-4">
		<div class="flex items-center justify-between">
			<Label>文件名</Label>
			<Input bind:value={exportConfig.filename} class="w-40 h-8 text-xs" />
		</div>
		<div class="flex items-center justify-between">
			<Label>格式</Label>
			<div class="flex gap-1 border rounded-lg p-1">
				<Button variant={exportConfig.format === 'png' ? 'default' : 'ghost'} size="sm" onclick={() => (exportConfig.format = 'png')}>PNG</Button>
				<Button variant={exportConfig.format === 'svg' ? 'default' : 'ghost'} size="sm" onclick={() => (exportConfig.format = 'svg')}>SVG</Button>
			</div>
		</div>
		<Button class="w-full" onclick={onExport}>
			<Icon icon="mdi:download" class="mr-2 h-4 w-4" />导出封面
		</Button>
	</CardContent>
</Card>
