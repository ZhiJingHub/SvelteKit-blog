<script lang="ts">
	import { onDestroy } from 'svelte';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Tabs, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';
	import { Switch } from '$lib/components/ui/switch';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import Icon from '@iconify/svelte';
	import { siteConfig } from '$lib/config/site';

	type ToolMode = 'prism' | 'shadow';
	type UploadKind = 'source' | 'hidden';
	type LoadedImage = { file: File; name: string; width: number; height: number; url: string; image: HTMLImageElement };
	type ModeResult = { url: string; width: number; height: number; statusMessage: string; errorMessage: string };

	const DEFAULT_SOURCE_BRIGHTNESS = 100;
	const DEFAULT_SOURCE_CONTRAST = 20;
	const DEFAULT_HIDDEN_BRIGHTNESS = 90;
	const DEFAULT_HIDDEN_CONTRAST = 100;
	const DEFAULT_SHADOWS = { isColored: true, scaleInner: 0.3, scaleCover: 0.2, desatInner: 0, desatCover: 0, weightInner: 0.7, maxSize: 1200 };

	const initialResults: Record<ToolMode, ModeResult> = {
		prism: { url: '', width: 0, height: 0, statusMessage: '请先上传原图与隐藏图，再生成输出 PNG。', errorMessage: '' },
		shadow: { url: '', width: 0, height: 0, statusMessage: '请先上传白底图与黑底图，再生成输出 PNG。', errorMessage: '' }
	};

	const modeMetaMap = {
		prism: { name: '光棱坦克', description: '保留现有棋盘格幻影图算法，适合制作需要全局拉高亮度后才更容易识别隐藏图的 PNG。', sourceLabel: '原图', hiddenLabel: '隐藏图', sourceCta: '点击上传原图', hiddenCta: '点击上传隐藏图', sourceHint: '支持常见图片格式，生成时将以这张图片的宽高作为最终输出尺寸。', hiddenHint: '隐藏图会在生成时按原图尺寸统一缩放，并参与棋盘格交错合成。', emptyResultHint: '尚未生成结果。上传两张图片并调整参数后，点击"生成图像"即可在此处预览并下载 PNG。', resultDescription: '输出为 PNG 棋盘图。该模式严格使用原始算法，不提供黑白底双预览。' },
		shadow: { name: '幻影坦克', description: '使用 Mirage_Colored 核心逻辑：支持全彩输出、黑白双背景预览，以及亮度/去色/权重控制。', sourceLabel: '白底图', hiddenLabel: '黑底图', sourceCta: '点击上传白底图', hiddenCta: '点击上传黑底图', sourceHint: '对应源码里的表图，会在生成时按黑底图的画幅进行居中裁切适配。', hiddenHint: '对应源码里的里图，输出尺寸和最大尺寸缩放以这张图为基准。', emptyResultHint: '尚未生成结果。上传白底图与黑底图后，点击"生成图像"即可查看同一 PNG 在白底 / 黑底下的差异。', resultDescription: '输出为单张透明 PNG，使用 Mirage_Colored 核心像素处理逻辑，并提供白底 / 黑底双预览。' }
	} as const;

	let mode = $state<ToolMode>('prism');
	let sourceImage = $state<LoadedImage | null>(null);
	let hiddenImage = $state<LoadedImage | null>(null);
	let outputCanvas: HTMLCanvasElement | undefined = $state();
	let sourceBrightness = $state(DEFAULT_SOURCE_BRIGHTNESS);
	let sourceContrast = $state(DEFAULT_SOURCE_CONTRAST);
	let hiddenBrightness = $state(DEFAULT_HIDDEN_BRIGHTNESS);
	let hiddenContrast = $state(DEFAULT_HIDDEN_CONTRAST);
	let isGenerating = $state(false);
	let shadowIsColored = $state(DEFAULT_SHADOWS.isColored);
	let shadowInnerScale = $state(DEFAULT_SHADOWS.scaleInner);
	let shadowCoverScale = $state(DEFAULT_SHADOWS.scaleCover);
	let shadowInnerDesat = $state(DEFAULT_SHADOWS.desatInner);
	let shadowCoverDesat = $state(DEFAULT_SHADOWS.desatCover);
	let shadowInnerWeight = $state(DEFAULT_SHADOWS.weightInner);
	let shadowMaxSize = $state(DEFAULT_SHADOWS.maxSize);
	let results = $state<Record<ToolMode, ModeResult>>(structuredClone(initialResults));
	const fileUrls = new Set<string>();

	let currentMeta = $derived(modeMetaMap[mode]);
	let currentResult = $derived(results[mode]);
	let sizeMismatch = $derived(sourceImage && hiddenImage ? sourceImage.width !== hiddenImage.width || sourceImage.height !== hiddenImage.height : false);

	const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

	function updateModeResult(key: ToolMode, patch: Partial<ModeResult>) { results = { ...results, [key]: { ...results[key], ...patch } }; }
	function resetModeResult(key: ToolMode) { updateModeResult(key, { ...initialResults[key] }); }
	function setModeError(key: ToolMode, msg: string, status: string) { updateModeResult(key, { errorMessage: msg, statusMessage: status }); }
	function clearModeError(key: ToolMode) { updateModeResult(key, { errorMessage: '' }); }
	function getInputActionText(kind: UploadKind) { const img = kind === 'source' ? sourceImage : hiddenImage; const label = kind === 'source' ? currentMeta.sourceLabel : currentMeta.hiddenLabel; return img ? `更换${label}` : kind === 'source' ? currentMeta.sourceCta : currentMeta.hiddenCta; }
	function getInputHint(kind: UploadKind) { return kind === 'source' ? currentMeta.sourceHint : currentMeta.hiddenHint; }
	function getDownloadFileName() { return mode === 'prism' ? 'prism-tank.png' : 'shadow-tank.png'; }
	function adjustPixelBrightnessContrast(r: number, g: number, b: number, bf: number, cf: number) { const ac = (v: number) => clamp((v - 128) * cf + 128, 0, 255); return [ac(r * bf), ac(g * bf), ac(b * bf)] as const; }
	function revokeFileUrl(url?: string) { if (!url) return; URL.revokeObjectURL(url); fileUrls.delete(url); }
	function loadImage(file: File): Promise<LoadedImage> {
		const url = URL.createObjectURL(file); fileUrls.add(url);
		return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve({ file, name: file.name, width: img.naturalWidth, height: img.naturalHeight, url, image: img }); img.onerror = () => { revokeFileUrl(url); reject(new Error('图片读取失败')); }; img.src = url; });
	}

	async function handleFileChange(event: Event, kind: UploadKind) {
		const input = event.currentTarget as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
		resetModeResult(mode);
		if (!file.type.startsWith('image/')) { setModeError(mode, '仅支持上传图片文件。', '未满足生成条件。'); input.value = ''; return; }
		try {
			const loaded = await loadImage(file);
			if (kind === 'source') { revokeFileUrl(sourceImage?.url); sourceImage = loaded; } else { revokeFileUrl(hiddenImage?.url); hiddenImage = loaded; }
			updateModeResult(mode, { errorMessage: '', statusMessage: sourceImage && hiddenImage ? '图片已更新，可点击生成。' : '图片已加载，请继续上传另一张图片。' });
		} catch (e) { setModeError(mode, e instanceof Error ? e.message : '图片读取失败。', '图片加载失败。'); }
	}

	function resetPrismControls() { sourceBrightness = DEFAULT_SOURCE_BRIGHTNESS; sourceContrast = DEFAULT_SOURCE_CONTRAST; hiddenBrightness = DEFAULT_HIDDEN_BRIGHTNESS; hiddenContrast = DEFAULT_HIDDEN_CONTRAST; resetModeResult('prism'); updateModeResult('prism', { statusMessage: '参数已重置为默认值，可重新生成。' }); }
	function resetShadowControls() { shadowIsColored = DEFAULT_SHADOWS.isColored; shadowInnerScale = DEFAULT_SHADOWS.scaleInner; shadowCoverScale = DEFAULT_SHADOWS.scaleCover; shadowInnerDesat = DEFAULT_SHADOWS.desatInner; shadowCoverDesat = DEFAULT_SHADOWS.desatCover; shadowInnerWeight = DEFAULT_SHADOWS.weightInner; shadowMaxSize = DEFAULT_SHADOWS.maxSize; resetModeResult('shadow'); updateModeResult('shadow', { statusMessage: '参数已重置为默认值，可重新生成。' }); }
	function downloadResult() { if (!currentResult.url || !sourceImage || !hiddenImage) return; const a = document.createElement('a'); a.href = currentResult.url; a.download = getDownloadFileName(); a.click(); }

	function createPrismContext(w: number, h: number) {
		if (!outputCanvas) throw new Error('Canvas 未就绪'); outputCanvas.width = w; outputCanvas.height = h;
		const oc = outputCanvas.getContext('2d'); if (!oc) throw new Error('浏览器不支持 Canvas');
		const bc = document.createElement('canvas'); bc.width = w; bc.height = h; const bctx = bc.getContext('2d');
		const ovc = document.createElement('canvas'); ovc.width = w; ovc.height = h; const ovctx = ovc.getContext('2d');
		if (!bctx || !ovctx) throw new Error('浏览器不支持离屏 Canvas');
		bctx.drawImage(sourceImage!.image, 0, 0, w, h); ovctx.drawImage(hiddenImage!.image, 0, 0, w, h);
		return { outputContext: oc, baseData: bctx.getImageData(0, 0, w, h), overlayData: ovctx.getImageData(0, 0, w, h) };
	}

	function createShadowContext() {
		if (!outputCanvas) throw new Error('Canvas 未就绪'); const innerImg = hiddenImage!, coverImg = sourceImage!;
		let w = innerImg.width, h = innerImg.height; const ms = Math.max(0, Math.floor(shadowMaxSize));
		if (ms) { w = innerImg.width > innerImg.height ? ms : Math.ceil((innerImg.height * ms) / innerImg.width); h = innerImg.width > innerImg.height ? Math.ceil((innerImg.width * ms) / innerImg.height) : ms; }
		const ic = document.createElement('canvas'); ic.width = w; ic.height = h; const ictx = ic.getContext('2d');
		const cc = document.createElement('canvas'); cc.width = w; cc.height = h; const cctx = cc.getContext('2d');
		outputCanvas.width = w; outputCanvas.height = h; const oc = outputCanvas.getContext('2d');
		if (!ictx || !cctx || !oc) throw new Error('浏览器不支持幻影坦克所需 Canvas');
		ictx.drawImage(innerImg.image, 0, 0, w, h);
		const cr = coverImg.width / coverImg.height; const tr = w / h; let dx = 0, dy = 0, dw = w, dh = h;
		if (cr < tr) { dh = Math.ceil(w / cr); dy = Math.ceil((h - dh) / 2); } else { dw = Math.ceil(h * cr); dx = Math.ceil((w - dw) / 2); }
		cctx.drawImage(coverImg.image, dx, dy, dw, dh);
		return { width: w, height: h, outputContext: oc, innerData: ictx.getImageData(0, 0, w, h), coverData: cctx.getImageData(0, 0, w, h) };
	}

	function convertGray(d: ImageData) { const r = new Uint8ClampedArray(d.data.length >> 2); for (let i = 0; i < d.data.length; i += 4) r[i >> 2] = 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2]; return r; }

	function generatePrismImage() {
		const w = sourceImage!.width, h = sourceImage!.height; const { outputContext, baseData, overlayData } = createPrismContext(w, h);
		const res = outputContext.createImageData(w, h);
		const oB = 1 + sourceBrightness / 100, hB = 1 - hiddenBrightness / 100, oC = sourceContrast / 100, hC = hiddenContrast / 100;
		for (let i = 0; i < baseData.data.length; i += 4) { const px = i / 4, x = px % w, y = Math.floor(px / w); let r: number, g: number, b: number; if ((x + y) % 2 === 0) { const p = adjustPixelBrightnessContrast(baseData.data[i], baseData.data[i + 1], baseData.data[i + 2], oB, oC); r = p[0]; g = p[1]; b = p[2]; } else { const p = adjustPixelBrightnessContrast(overlayData.data[i], overlayData.data[i + 1], overlayData.data[i + 2], hB, hC); r = p[0]; g = p[1]; b = p[2]; } res.data[i] = r; res.data[i + 1] = g; res.data[i + 2] = b; res.data[i + 3] = 255; }
		outputContext.putImageData(res, 0, 0); updateModeResult('prism', { url: outputCanvas!.toDataURL('image/png'), width: w, height: h, errorMessage: '', statusMessage: '生成完成。' });
	}

	function generateShadowImage() {
		const { width, height, outputContext, innerData, coverData } = createShadowContext();
		const innerGray = convertGray(innerData), coverGray = convertGray(coverData);
		const ip = innerData.data, cp = coverData.data, od = new Uint8ClampedArray(ip.length);
		const isc = shadowInnerScale, csc = 1 - shadowCoverScale;
		if (shadowIsColored) {
			const ic = new Uint8ClampedArray(ip.length), cc = new Uint8ClampedArray(cp.length), ac = new Float32Array(innerGray.length);
			for (let i = 0; i < ip.length; i += 4) { const g = innerGray[i >> 2] * isc, R = ip[i] * isc, G = ip[i + 1] * isc, B = ip[i + 2] * isc; ic[i] = R + (g - R) * shadowInnerDesat; ic[i + 1] = G + (g - G) * shadowInnerDesat; ic[i + 2] = B + (g - B) * shadowInnerDesat; }
			for (let i = 0; i < cp.length; i += 4) { const g = 255 - (255 - coverGray[i >> 2]) * csc, R = 255 - (255 - cp[i]) * csc, G = 255 - (255 - cp[i + 1]) * csc, B = 255 - (255 - cp[i + 2]) * csc; cc[i] = R + (g - R) * shadowCoverDesat; cc[i + 1] = G + (g - G) * shadowCoverDesat; cc[i + 2] = B + (g - B) * shadowCoverDesat; }
			for (let i = 0; i < innerGray.length; i++) ac[i] = clamp((255 + innerGray[i] * isc - (255 - (255 - coverGray[i]) * csc)) / 255, 0, 1);
			for (let i = 0; i < ip.length; i += 4) { const a = ac[i >> 2], ac2 = 255 * a, sa = Math.max(a, 0.0001); od[i] = clamp(((ic[i] - ac2 + 255 - cc[i]) * shadowInnerWeight + ac2 - 255 + cc[i]) / sa, 0, 255); od[i + 1] = clamp(((ic[i + 1] - ac2 + 255 - cc[i + 1]) * shadowInnerWeight + ac2 - 255 + cc[i + 1]) / sa, 0, 255); od[i + 2] = clamp(((ic[i + 2] - ac2 + 255 - cc[i + 2]) * shadowInnerWeight + ac2 - 255 + cc[i + 2]) / sa, 0, 255); od[i + 3] = clamp(255 * a, 0, 255); }
		} else {
			for (let i = 0; i < innerGray.length; i++) { const inner = innerGray[i] * isc, alpha = 255 + inner - (255 - (255 - coverGray[i]) * csc), sa = Math.max(alpha, 0.0001), color = clamp((255 * inner) / sa, 0, 255); od[i << 2] = color; od[(i << 2) + 1] = color; od[(i << 2) + 2] = color; od[(i << 2) + 3] = clamp(alpha, 0, 255); }
		}
		outputContext.putImageData(new ImageData(od, width, height), 0, 0); updateModeResult('shadow', { url: outputCanvas!.toDataURL('image/png'), width, height, errorMessage: '', statusMessage: '生成完成。' });
	}

	function generateImage() {
		if (!sourceImage || !hiddenImage) { setModeError(mode, '请先上传两张图片。', '未满足生成条件。'); return; }
		isGenerating = true; clearModeError(mode); resetModeResult(mode);
		try { mode === 'prism' ? generatePrismImage() : generateShadowImage(); } catch (e) { setModeError(mode, e instanceof Error ? e.message : '生成失败。', '生成失败。'); } finally { isGenerating = false; }
	}

	onDestroy(() => { revokeFileUrl(sourceImage?.url); revokeFileUrl(hiddenImage?.url); });
</script>

<svelte:head>
	<title>光棱坦克 / 幻影坦克 - {siteConfig.title}</title>
	<meta name="description" content="本地生成支持白底/黑底显隐效果的 PNG" />
</svelte:head>

<canvas bind:this={outputCanvas} class="hidden"></canvas>

<div class="container mx-auto max-w-6xl px-4 py-12 space-y-6">
	<Card>
		<CardHeader>
			<div class="flex flex-wrap items-center justify-between gap-3">
				<CardTitle class="flex items-center gap-2 text-2xl">
					<Icon icon="mdi:layers-triple" class="size-6 text-primary" />
					光棱坦克 / 幻影坦克
				</CardTitle>
			</div>
		</CardHeader>
		<CardContent>
			<p class="text-sm text-muted-foreground leading-relaxed">
				同页支持光棱坦克与幻影坦克两种模式：可在浏览器本地完成双图上传、生成、预览与 PNG 下载；所有处理均在前端完成，不会上传到服务端。
			</p>
		</CardContent>
	</Card>

	<Card>
		<CardContent class="space-y-3 py-4">
			<Tabs value={mode} onValueChange={(v) => (mode = v as ToolMode)}>
				<TabsList>
					<TabsTrigger value="prism">{modeMetaMap.prism.name}</TabsTrigger>
					<TabsTrigger value="shadow">{modeMetaMap.shadow.name}</TabsTrigger>
				</TabsList>
			</Tabs>
			<p class="text-sm text-muted-foreground leading-relaxed">{currentMeta.description}</p>
		</CardContent>
	</Card>

	<div class="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
		<section class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle class="text-lg">上传图片</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="grid gap-4 md:grid-cols-2">
						{#each ['source', 'hidden'] as kind}
							{@const k = kind as UploadKind}
							{@const image = k === 'source' ? sourceImage : hiddenImage}
							{@const label = k === 'source' ? currentMeta.sourceLabel : currentMeta.hiddenLabel}
							<div class="space-y-3">
								<Label for="ptg-{k}-upload">{label}</Label>
								<input id="ptg-{k}-upload" type="file" accept="image/*" class="hidden" onchange={(e) => handleFileChange(e, k)} />
								<Label for="ptg-{k}-upload" class="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/30 px-4 py-5 text-center transition-colors hover:border-primary">
									<Icon icon="mdi:image-plus" class="mb-2 size-6 text-muted-foreground" />
									<span class="mb-1 text-sm font-medium">{getInputActionText(k)}</span>
									<span class="text-xs text-muted-foreground leading-relaxed">{getInputHint(k)}</span>
								</Label>
								{#if image}
									<div class="rounded-lg border bg-muted/30 p-3">
										<img src={image.url} alt="{label}预览" class="mb-2 max-h-44 w-full rounded-md object-contain" />
										<p class="text-xs text-muted-foreground break-all">{image.name}</p>
										<p class="text-xs text-muted-foreground">{image.width} × {image.height}</p>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<div class="flex items-center justify-between gap-3">
						<div>
							<CardTitle class="text-lg">参数与操作</CardTitle>
						</div>
						<Button variant="outline" size="sm" onclick={mode === 'prism' ? resetPrismControls : resetShadowControls}>{mode === 'prism' ? '重置参数' : '恢复默认'}</Button>
					</div>
				</CardHeader>
				<CardContent class="space-y-5">
					{#if mode === 'prism'}
						<div class="grid gap-5 md:grid-cols-2">
							<div class="space-y-4 rounded-lg border bg-muted/30 p-4">
								<h3 class="text-sm font-semibold">原图参数</h3>
								<div class="space-y-2"><div class="flex items-center justify-between text-sm text-muted-foreground"><span>原图亮度提高 (%)</span><span class="font-mono text-foreground">{sourceBrightness}</span></div><Slider type="single" value={sourceBrightness} onValueChange={(v) => (sourceBrightness = v as number)} min={0} max={200} step={1} /></div>
								<div class="space-y-2"><div class="flex items-center justify-between text-sm text-muted-foreground"><span>原图对比度 (%)</span><span class="font-mono text-foreground">{sourceContrast}</span></div><Slider type="single" value={sourceContrast} onValueChange={(v) => (sourceContrast = v as number)} min={10} max={300} step={1} /></div>
							</div>
							<div class="space-y-4 rounded-lg border bg-muted/30 p-4">
								<h3 class="text-sm font-semibold">隐藏图参数</h3>
								<div class="space-y-2"><div class="flex items-center justify-between text-sm text-muted-foreground"><span>隐藏图亮度降低 (%)</span><span class="font-mono text-foreground">{hiddenBrightness}</span></div><Slider type="single" value={hiddenBrightness} onValueChange={(v) => (hiddenBrightness = v as number)} min={0} max={100} step={1} /></div>
								<div class="space-y-2"><div class="flex items-center justify-between text-sm text-muted-foreground"><span>隐藏图对比度 (%)</span><span class="font-mono text-foreground">{hiddenContrast}</span></div><Slider type="single" value={hiddenContrast} onValueChange={(v) => (hiddenContrast = v as number)} min={10} max={300} step={1} /></div>
							</div>
						</div>
					{:else}
						<div class="grid gap-5 md:grid-cols-2">
							<div class="space-y-4 rounded-lg border bg-muted/30 p-4">
								<div class="flex items-center justify-between gap-3"><Label for="shadow-colored" class="text-sm font-semibold">全彩输出</Label><Switch id="shadow-colored" bind:checked={shadowIsColored} /></div>
								<div class="space-y-2"><div class="flex items-center justify-between text-sm text-muted-foreground"><span>黑底图缩放</span><span class="font-mono text-foreground">{shadowInnerScale.toFixed(2)}</span></div><Slider type="single" value={shadowInnerScale} onValueChange={(v) => (shadowInnerScale = v as number)} min={0} max={1} step={0.02} /></div>
								<div class="space-y-2"><div class="flex items-center justify-between text-sm text-muted-foreground"><span>黑底图去色</span><span class="font-mono text-foreground">{shadowInnerDesat.toFixed(2)}</span></div><Slider type="single" value={shadowInnerDesat} onValueChange={(v) => (shadowInnerDesat = v as number)} min={0} max={1} step={0.02} /></div>
								<div class="space-y-2"><div class="flex items-center justify-between text-sm text-muted-foreground"><span>黑底图混合权重</span><span class="font-mono text-foreground">{shadowInnerWeight.toFixed(2)}</span></div><Slider type="single" value={shadowInnerWeight} onValueChange={(v) => (shadowInnerWeight = v as number)} min={0} max={1} step={0.02} /></div>
							</div>
							<div class="space-y-4 rounded-lg border bg-muted/30 p-4">
								<div class="space-y-2"><div class="flex items-center justify-between text-sm text-muted-foreground"><span>白底图缩放</span><span class="font-mono text-foreground">{shadowCoverScale.toFixed(2)}</span></div><Slider type="single" value={shadowCoverScale} onValueChange={(v) => (shadowCoverScale = v as number)} min={0} max={1} step={0.02} /></div>
								<div class="space-y-2"><div class="flex items-center justify-between text-sm text-muted-foreground"><span>白底图去色</span><span class="font-mono text-foreground">{shadowCoverDesat.toFixed(2)}</span></div><Slider type="single" value={shadowCoverDesat} onValueChange={(v) => (shadowCoverDesat = v as number)} min={0} max={1} step={0.02} /></div>
								<div class="space-y-2"><div class="flex items-center justify-between text-sm text-muted-foreground"><span>最大尺寸</span><span class="font-mono text-foreground">{shadowMaxSize}</span></div><Slider type="single" value={shadowMaxSize} onValueChange={(v) => (shadowMaxSize = v as number)} min={0} max={4000} step={1} /></div>
							</div>
						</div>
					{/if}
					<Button class="w-full" onclick={generateImage} disabled={isGenerating || !sourceImage || !hiddenImage}>
						<Icon icon={isGenerating ? 'mdi:loading' : 'mdi:image-auto-adjust'} class="mr-2 h-4 w-4 {isGenerating ? 'animate-spin' : ''}" />
						{isGenerating ? '生成中...' : '生成图像'}
					</Button>
				</CardContent>
			</Card>
		</section>

		<section class="space-y-6">
			<Card>
				<CardHeader><CardTitle class="text-lg">生成结果</CardTitle></CardHeader>
				<CardContent class="space-y-4">
					{#if currentResult.errorMessage}
						<Alert variant="destructive"><AlertDescription>{currentResult.errorMessage}</AlertDescription></Alert>
					{/if}
					{#if currentResult.url}
						<div class="rounded-lg border bg-muted/30 p-4">
							<img src={currentResult.url} alt="生成结果" class="w-full rounded-md" />
							<p class="mt-2 text-xs text-muted-foreground">{currentResult.width} × {currentResult.height}</p>
							<Button class="mt-3 w-full" variant="outline" onclick={downloadResult}>
								<Icon icon="mdi:download" class="mr-2 h-4 w-4" />下载 PNG
							</Button>
						</div>
					{:else}
						<div class="flex min-h-40 items-center justify-center rounded-lg border border-dashed bg-muted/30 p-4 text-sm text-muted-foreground">
							{currentMeta.emptyResultHint}
						</div>
					{/if}
					{#if currentResult.statusMessage && !currentResult.errorMessage}
						<p class="text-sm text-muted-foreground text-center">{currentResult.statusMessage}</p>
					{/if}
				</CardContent>
			</Card>
		</section>
	</div>
</div>
