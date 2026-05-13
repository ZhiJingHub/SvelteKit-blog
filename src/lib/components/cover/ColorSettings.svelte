<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Slider } from '$lib/components/ui/slider';

	let {
		color = $bindable(),
		iconColor = $bindable(),
		bgColor = $bindable(),
		bgColorOpacity = $bindable(),
		linkColor = $bindable(),
		useOriginalIconColor = $bindable(),
		onColorChange
	}: {
		color: string;
		iconColor: string;
		bgColor: string;
		bgColorOpacity: number;
		linkColor: boolean;
		useOriginalIconColor: boolean;
		onColorChange: (newColor: string, type: 'text' | 'icon') => void;
	} = $props();
</script>

<Card>
	<CardHeader>
		<CardTitle class="flex items-center justify-between">
			<span>颜色设置</span>
			<div class="flex gap-2">
				<label class="flex items-center gap-2 cursor-pointer">
					<Checkbox bind:checked={linkColor} />
					<span class="text-sm font-normal">颜色同步</span>
				</label>
				<label class="flex items-center gap-2 cursor-pointer">
					<Checkbox bind:checked={useOriginalIconColor} />
					<span class="text-sm font-normal">原色图标</span>
				</label>
			</div>
		</CardTitle>
	</CardHeader>
	<CardContent class="space-y-4">
		<div class="flex items-center justify-between">
			<Label>文字颜色</Label>
			<div class="flex items-center gap-2">
				<Input
					type="text"
					value={color}
					oninput={(e) => onColorChange(e.currentTarget.value, 'text')}
					class="w-24 h-8 text-xs"
				/>
				<input
					type="color"
					value={color}
					oninput={(e) => onColorChange(e.currentTarget.value, 'text')}
					class="w-8 h-8 rounded cursor-pointer"
				/>
			</div>
		</div>

		<div class="flex items-center justify-between">
			<Label>图标颜色</Label>
			<div class="flex items-center gap-2">
				<Input
					type="text"
					value={iconColor}
					disabled={useOriginalIconColor}
					oninput={(e) => onColorChange(e.currentTarget.value, 'icon')}
					class="w-24 h-8 text-xs"
				/>
				<input
					type="color"
					value={iconColor}
					disabled={useOriginalIconColor}
					oninput={(e) => onColorChange(e.currentTarget.value, 'icon')}
					class="w-8 h-8 rounded cursor-pointer"
				/>
			</div>
		</div>

		<div class="flex items-center justify-between">
			<Label>背景颜色</Label>
			<div class="flex items-center gap-2">
				<Input type="text" bind:value={bgColor} class="w-24 h-8 text-xs" />
				<input type="color" bind:value={bgColor} class="w-8 h-8 rounded cursor-pointer" />
			</div>
		</div>

		<div class="space-y-2">
			<Label>背景不透明�? {Math.round(bgColorOpacity * 100)}%</Label>
			<Slider
				value={[bgColorOpacity]}
				onValueChange={(v: number[]) => (bgColorOpacity = v[0])}
				min={0}
				max={1}
				step={0.01}
			/>
		</div>
	</CardContent>
</Card>
