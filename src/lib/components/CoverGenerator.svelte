<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import CoverPreview from './cover/CoverPreview.svelte';
	import TextSettings from './cover/TextSettings.svelte';
	import IconSettings from './cover/IconSettings.svelte';
	import BackgroundSettings from './cover/BackgroundSettings.svelte';
	import SizeSettings from './cover/SizeSettings.svelte';
	import ColorSettings from './cover/ColorSettings.svelte';
	import IconBackgroundSettings from './cover/IconBackgroundSettings.svelte';
	import ShadowSettings from './cover/ShadowSettings.svelte';
	import ExportSettings from './cover/ExportSettings.svelte';
	import Root from '$lib/components/ui/tabs/tabs.svelte';
	import TabsList from '$lib/components/ui/tabs/tabs-list.svelte';
	import TabsTrigger from '$lib/components/ui/tabs/tabs-trigger.svelte';
	import TabsContent from '$lib/components/ui/tabs/tabs-content.svelte';
	import { Button } from '$lib/components/ui/button';
	import Icon from '@iconify/svelte';

	let innerWidth = $state(0);

	let leftText = $state('左侧文字');
	let rightText = $state('右侧文字');
	let fontWeight = $state(400);

	let iconName = $state('logos:svelte-icon');
	let iconSize = $state(64);
	let iconSvg = $state('');
	let localIcon = $state<string | null>(null);
	let showIcon = $state(true);
	let iconColor = $state('#000000');
	let useOriginalIconColor = $state(true);
	let iconRadius = $state(0);
	let searchQuery = $state('');
	let searchResults = $state<string[]>([]);
	let isSearching = $state(false);
	let searchDebounce: ReturnType<typeof setTimeout>;

	let fontSize = $state(64);
	let customFont = $state<string | null>(null);
	let customFontName = $state('');
	let fontArrayBuffer: ArrayBuffer | null = null;
	let fontMimeType = '';

	let gap = $state(20);

	let color = $state('#000000');
	let bgColor = $state('#ffffff');
	let bgColorOpacity = $state(1);
	let linkColor = $state(true);

	let textShadow = $state({ x: 0, y: 0, blur: 0, color: '#000000', alpha: 0 });
	let iconShadow = $state({ x: 0, y: 0, blur: 0, color: '#000000', alpha: 0 });
	let shadowTarget = $state<'both' | 'text' | 'icon'>('both');

	let iconBgEnabled = $state(false);
	let iconBgRadius = $state(20);
	let iconBgColor = $state('#000000');
	let iconBgOpacity = $state(0.2);
	let iconBgBlur = $state(0);
	let iconBgPadding = $state(10);

	let bgImage = $state<string | null>(null);
	let bgImageX = $state(0);
	let bgImageY = $state(0);
	let bgImageScale = $state(1);
	let bgBlur = $state(0);
	let bgOpacity = $state(1);
	let isBgDragOver = $state(false);
	let isDragging = $state(false);

	let ratios = $state([
		{ label: '1:1', w: 1, h: 1, checked: false },
		{ label: '4:3', w: 4, h: 3, checked: false },
		{ label: '16:9', w: 16, h: 9, checked: true },
		{ label: '21:9', w: 21, h: 9, checked: false }
	]);

	let linkScale = $state(true);
	let lastFontSize = $state(64);
	let lastIconSize = $state(64);

	let exportConfig = $state({
		format: 'png' as 'png' | 'svg',
		scales: [1] as number[],
		filename: 'cover',
		transparentBg: false,
		exportRatios: [] as string[]
	});

	let svgContainer: SVGSVGElement | undefined = $state();

	let dragStartX = 0;
	let dragStartY = 0;
	let initialImageX = 0;
	let initialImageY = 0;
	let activePointers = new Map<number, { x: number; y: number }>();
	let initialPinchDistance = 0;
	let initialScale = 1;

	let iconFetchController: AbortController | null = null;

	const BASE_HEIGHT = 600;
	let activeRatios = $derived(ratios.filter((r) => r.checked));
	let visualRatios = $derived(activeRatios.length > 0 ? activeRatios : [ratios[2]]);
	let maxWidthRatio = $derived(
		visualRatios.reduce((max, r) => (r.w / r.h > max ? r.w / r.h : max), 0)
	);
	let canvasWidth = $derived(Math.round(BASE_HEIGHT * maxWidthRatio));
	let canvasHeight = $derived(BASE_HEIGHT);

	function getFontDataBase64(): string | null {
		if (!fontArrayBuffer) return null;
		const bytes = new Uint8Array(fontArrayBuffer);
		const chunks: string[] = [];
		const chunkSize = 8192;
		for (let i = 0; i < bytes.length; i += chunkSize) {
			const chunk = bytes.subarray(i, i + chunkSize);
			chunks.push(String.fromCharCode(...chunk));
		}
		return `data:${fontMimeType};base64,${btoa(chunks.join(''))}`;
	}

	function updateShadow(key: string, value: string | number) {
		if (shadowTarget === 'both' || shadowTarget === 'text') {
			textShadow = { ...textShadow, [key]: value };
		}
		if (shadowTarget === 'both' || shadowTarget === 'icon') {
			iconShadow = { ...iconShadow, [key]: value };
		}
	}

	function handleColorChange(newColor: string, type: 'text' | 'icon') {
		if (type === 'text') {
			color = newColor;
			if (linkColor) iconColor = newColor;
		} else {
			iconColor = newColor;
			if (linkColor) color = newColor;
		}
	}

	function handleFontSizeChange(value: number) {
		if (linkScale) {
			const ratio = value / lastFontSize;
			iconSize = Math.round(iconSize * ratio);
			lastIconSize = iconSize;
		}
		fontSize = value;
		lastFontSize = value;
	}

	function handleIconSizeChange(value: number) {
		if (linkScale) {
			const ratio = value / lastIconSize;
			fontSize = Math.round(fontSize * ratio);
			lastFontSize = fontSize;
		}
		iconSize = value;
		lastIconSize = value;
	}

	function handleBgImageUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (file) loadBgImageFile(file);
	}

	function loadBgImageFile(file: File) {
		if (!file.type.startsWith('image/')) return;
		if (bgImage?.startsWith('blob:')) URL.revokeObjectURL(bgImage);
		const url = URL.createObjectURL(file);
		bgImage = url;
		bgImageX = 0;
		bgImageY = 0;
		bgImageScale = 1;
		bgBlur = 0;
		bgOpacity = 1;
	}

	function handleFontUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		if (customFont) URL.revokeObjectURL(customFont);
		const reader = new FileReader();
		reader.onload = (ev) => {
			const fontData = ev.target?.result as ArrayBuffer;
			customFontName = file.name.replace(/\.[^/.]+$/, '');
			customFont = URL.createObjectURL(new Blob([fontData]));
			fontArrayBuffer = fontData;
			fontMimeType = file.type || 'application/octet-stream';
			const fontFace = new FontFace(customFontName, `url(${customFont})`);
			fontFace.load().then((loadedFace) => {
				document.fonts.add(loadedFace);
			});
		};
		reader.readAsArrayBuffer(file);
	}

	function handleSystemFontSelect(fontName: string) {
		customFontName = fontName;
		customFont = null;
		fontArrayBuffer = null;
		fontMimeType = '';
	}

	async function handleSearch() {
		if (!searchQuery) {
			searchResults = [];
			return;
		}
		isSearching = true;
		try {
			const res = await fetch(
				`https://api.iconify.design/search?query=${encodeURIComponent(searchQuery)}&limit=20`
			);
			const data = await res.json();
			searchResults = data.icons || [];
		} catch {
			searchResults = [];
		} finally {
			isSearching = false;
		}
	}

	function onSearchInput(e: Event) {
		const val = (e.target as HTMLInputElement).value;
		searchQuery = val;
		clearTimeout(searchDebounce);
		if (val.trim()) {
			searchDebounce = setTimeout(() => handleSearch(), 500);
		} else {
			searchResults = [];
		}
	}

	function handleLocalIconUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		if (localIcon?.startsWith('blob:')) URL.revokeObjectURL(localIcon);
		const url = URL.createObjectURL(file);
		localIcon = url;
		iconName = '本地图片';
		iconSvg = '';
	}

	function selectIcon(icon: string) {
		iconName = icon;
		localIcon = null;
	}

	function handleBgDragOver(e: DragEvent) {
		e.preventDefault();
		isBgDragOver = true;
	}

	function handleBgDragLeave(e: DragEvent) {
		e.preventDefault();
		isBgDragOver = false;
	}

	function handleBgDrop(e: DragEvent) {
		e.preventDefault();
		isBgDragOver = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) loadBgImageFile(file);
	}

	function handlePointerDown(e: PointerEvent) {
		if (!bgImage) return;
		e.preventDefault();
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (activePointers.size === 1) {
			isDragging = true;
			dragStartX = e.clientX;
			dragStartY = e.clientY;
			initialImageX = bgImageX;
			initialImageY = bgImageY;
		} else if (activePointers.size === 2) {
			isDragging = false;
			const points = Array.from(activePointers.values());
			initialPinchDistance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
			initialScale = bgImageScale;
		}
	}

	function handlePointerMove(e: PointerEvent) {
		if (!bgImage || !activePointers.has(e.pointerId)) return;
		e.preventDefault();
		activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

		if (activePointers.size === 2) {
			const points = Array.from(activePointers.values());
			const currentDistance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y);
			if (initialPinchDistance > 0) {
				const scaleFactor = currentDistance / initialPinchDistance;
				bgImageScale = Math.max(0.1, Math.min(initialScale * scaleFactor, 10));
			}
		} else if (activePointers.size === 1 && isDragging) {
			const deltaX = e.clientX - dragStartX;
			const deltaY = e.clientY - dragStartY;
			bgImageX = initialImageX + deltaX / bgImageScale;
			bgImageY = initialImageY + deltaY / bgImageScale;
		}
	}

	function handlePointerUp(e: PointerEvent) {
		activePointers.delete(e.pointerId);
		(e.currentTarget as Element).releasePointerCapture(e.pointerId);
		if (activePointers.size < 2) initialPinchDistance = 0;
		if (activePointers.size === 0) isDragging = false;
	}

	function handleWheel(e: WheelEvent) {
		if (!bgImage) return;
		e.preventDefault();
		const scaleFactor = 1.1;
		if (e.deltaY < 0) {
			bgImageScale = Math.min(bgImageScale * scaleFactor, 10);
		} else {
			bgImageScale = Math.max(bgImageScale / scaleFactor, 0.1);
		}
	}

	async function doExport() {
		if (!svgContainer) return;

		const guides = svgContainer.querySelectorAll('.ratio-guide');
		for (const g of guides) (g as SVGElement).style.display = 'none';

		const border = svgContainer.querySelector('.canvas-border');
		if (border) (border as SVGElement).style.display = 'none';

		const svgClone = svgContainer.cloneNode(true) as SVGSVGElement;

		if (exportConfig.transparentBg) {
			const bgRects = svgClone.querySelectorAll('.bg-fill');
			for (const r of bgRects) r.remove();
		}

		const fontBase64 = getFontDataBase64();
		if (fontBase64) {
			const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
			style.textContent = `@font-face { font-family: '${customFontName}'; src: url(${fontBase64}); }`;
			svgClone.insertBefore(style, svgClone.firstChild);
		}

		if (bgImage) {
			const imgEl = svgClone.querySelector('image[href]');
			if (imgEl && bgImage.startsWith('blob:')) {
				try {
					const response = await fetch(bgImage);
					const blob = await response.blob();
					const dataUrl = await new Promise<string>((resolve) => {
						const reader = new FileReader();
						reader.onload = () => resolve(reader.result as string);
						reader.readAsDataURL(blob);
					});
					imgEl.setAttribute('href', dataUrl);
				} catch {
				}
			}
		}

		if (localIcon) {
			const localImgEl = svgClone.querySelector('img[src]');
			if (localImgEl && localIcon.startsWith('blob:')) {
				try {
					const response = await fetch(localIcon);
					const blob = await response.blob();
					const dataUrl = await new Promise<string>((resolve) => {
						const reader = new FileReader();
						reader.onload = () => resolve(reader.result as string);
						reader.readAsDataURL(blob);
					});
					localImgEl.setAttribute('src', dataUrl);
				} catch {
				}
			}
		}

		const ratiosToExport =
			exportConfig.exportRatios.length > 0
				? ratios.filter((r) => exportConfig.exportRatios.includes(r.label))
				: activeRatios;

		for (const ratio of ratiosToExport) {
			const ratioWidth = Math.round(BASE_HEIGHT * (ratio.w / ratio.h));
			const ratioHeight = BASE_HEIGHT;
			const xOffset = (canvasWidth - ratioWidth) / 2;

			const ratioSvgClone = svgClone.cloneNode(true) as SVGSVGElement;
			ratioSvgClone.setAttribute('width', ratioWidth.toString());
			ratioSvgClone.setAttribute('height', ratioHeight.toString());
			ratioSvgClone.setAttribute('viewBox', `${xOffset} 0 ${ratioWidth} ${ratioHeight}`);

			const svgData = new XMLSerializer().serializeToString(ratioSvgClone);
			const ratioFilename =
				activeRatios.length > 1
					? `${exportConfig.filename}-${ratio.label.replace(':', '-')}`
					: exportConfig.filename;

			if (exportConfig.format === 'svg') {
				const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
				const url = URL.createObjectURL(blob);
				downloadLink(url, `${ratioFilename}.svg`);
				setTimeout(() => URL.revokeObjectURL(url), 1000);
			} else {
				const img = new Image();
				img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`;
				await new Promise<void>((resolve, reject) => {
					img.onload = () => resolve();
					img.onerror = () => reject(new Error('Image export failed'));
				});

				const scales = exportConfig.scales.length > 0 ? exportConfig.scales : [1];
				for (const scale of scales) {
					const canvas = document.createElement('canvas');
					canvas.width = ratioWidth * scale;
					canvas.height = ratioHeight * scale;
					const ctx = canvas.getContext('2d');
					if (!ctx) continue;
					ctx.imageSmoothingEnabled = true;
					ctx.imageSmoothingQuality = 'high';
					ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
					const suffix = scales.length > 1 ? `@${scale}x` : '';
					downloadLink(canvas.toDataURL('image/png'), `${ratioFilename}${suffix}.png`);
				}
			}
		}

		for (const g of guides) (g as SVGElement).style.display = '';
		if (border) (border as SVGElement).style.display = '';
	}

	function downloadLink(url: string, filename: string) {
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	$effect(() => {
		const currentIconName = iconName;
		const currentUseOriginal = useOriginalIconColor;

		if (currentIconName?.includes(':')) {
			if (iconFetchController) iconFetchController.abort();
			iconFetchController = new AbortController();

			const [prefix, name] = currentIconName.split(':');
			fetch(`https://api.iconify.design/${prefix}/${name}.svg`, {
				signal: iconFetchController.signal
			})
				.then((res) => {
					if (!res.ok) throw new Error('Icon not found');
					return res.text();
				})
				.then((svg) => {
					let processedSvg = svg
						.replace(/(<svg[^>]*>)\s*/, '$1')
						.replace(/<svg\s([^>]*?)\s+width="[^"]*"/g, '<svg $1')
						.replace(/<svg\s([^>]*?)\s+height="[^"]*"/g, '<svg $1');
					processedSvg = processedSvg.replace(
						/<svg\b([^>]*)>/,
						'<svg$1 width="100%" height="100%" preserveAspectRatio="xMidYMid meet">'
					);
					if (!currentUseOriginal) {
						processedSvg = processedSvg.replace(/fill="[^"]*"/g, 'fill="currentColor"');
					}
					iconSvg = processedSvg;
				})
				.catch((e) => {
					if (e.name !== 'AbortError') iconSvg = '';
				});
		} else {
			iconSvg = '';
		}

		return () => {
			if (iconFetchController) iconFetchController.abort();
		};
	});

	onMount(() => {
		innerWidth = window.innerWidth;
	});

	onDestroy(() => {
		if (customFont) URL.revokeObjectURL(customFont);
		if (bgImage?.startsWith('blob:')) URL.revokeObjectURL(bgImage);
		if (localIcon?.startsWith('blob:')) URL.revokeObjectURL(localIcon);
		if (iconFetchController) iconFetchController.abort();
		clearTimeout(searchDebounce);
	});
</script>

<svelte:window bind:innerWidth />

<div class="cover-layout">
	<div class="cover-preview-col">
		<CoverPreview
			bind:svgContainer
			{canvasWidth}
			{canvasHeight}
			{visualRatios}
			{bgImage}
			{bgImageX}
			{bgImageY}
			{bgImageScale}
			{bgBlur}
			{bgOpacity}
			{bgColor}
			{bgColorOpacity}
			{leftText}
			{rightText}
			{fontSize}
			{fontWeight}
			{customFontName}
			{color}
			{textShadow}
			{gap}
			{showIcon}
			{iconSvg}
			{localIcon}
			{iconSize}
			{iconBgPadding}
			{iconBgEnabled}
			{iconBgColor}
			{iconBgOpacity}
			{iconBgBlur}
			{iconBgRadius}
			{useOriginalIconColor}
			{iconColor}
			{iconShadow}
			{iconRadius}
			{isDragging}
			onPointerDown={handlePointerDown}
			onPointerMove={handlePointerMove}
			onPointerUp={handlePointerUp}
			onWheel={handleWheel}
		/>

		<div class="export-bar">
			<Button onclick={doExport} disabled={activeRatios.length === 0} class="flex-1" size="lg">
				<Icon icon="mdi:download" class="mr-2 h-5 w-5" />
				导出图片
			</Button>
			<ExportSettings
				bind:ratios
				bind:exportConfig
				{canvasWidth}
				{canvasHeight}
				{activeRatios}
				onExport={doExport}
			/>
		</div>
	</div>

	<div class="cover-settings-col">
		<Root value="text" class="w-full">
			<TabsList class="w-full">
				<TabsTrigger value="text">
					<Icon icon="mdi:format-text" class="mr-1.5 h-4 w-4" />
					文本
				</TabsTrigger>
				<TabsTrigger value="icon">
					<Icon icon="mdi:image-outline" class="mr-1.5 h-4 w-4" />
					图标
				</TabsTrigger>
				<TabsTrigger value="background">
					<Icon icon="mdi:image-area" class="mr-1.5 h-4 w-4" />
					背景
				</TabsTrigger>
				<TabsTrigger value="style">
					<Icon icon="mdi:palette-outline" class="mr-1.5 h-4 w-4" />
					样式
				</TabsTrigger>
				<TabsTrigger value="export">
					<Icon icon="mdi:cog-outline" class="mr-1.5 h-4 w-4" />
					导出
				</TabsTrigger>
			</TabsList>

			<TabsContent value="text">
				<TextSettings
					bind:leftText
					bind:rightText
					bind:fontWeight
					bind:customFontName
					onFontUpload={handleFontUpload}
					onSystemFontSelect={handleSystemFontSelect}
					onRemoveFont={() => {
						if (customFont) URL.revokeObjectURL(customFont);
						customFont = null;
						customFontName = '';
						fontArrayBuffer = null;
						fontMimeType = '';
					}}
				/>
				<SizeSettings
					bind:fontSize
					bind:iconSize
					bind:iconRadius
					bind:gap
					bind:linkScale
					onFontSizeChange={handleFontSizeChange}
					onIconSizeChange={handleIconSizeChange}
				/>
			</TabsContent>

			<TabsContent value="icon">
				<IconSettings
					bind:showIcon
					bind:localIcon
					bind:searchQuery
					bind:searchResults
					bind:iconName
					onLocalIconUpload={handleLocalIconUpload}
					{onSearchInput}
					onSelectIcon={selectIcon}
				/>
				<IconBackgroundSettings
					bind:iconBgEnabled
					bind:iconBgColor
					bind:iconBgPadding
					bind:iconBgRadius
					bind:iconBgBlur
					bind:iconBgOpacity
				/>
			</TabsContent>

			<TabsContent value="background">
				<BackgroundSettings
					bind:bgImage
					bind:bgBlur
					bind:bgOpacity
					bind:isBgDragOver
					onBgImageUpload={handleBgImageUpload}
					onBgDragOver={handleBgDragOver}
					onBgDragLeave={handleBgDragLeave}
					onBgDrop={handleBgDrop}
				/>
				<ColorSettings
					bind:color
					bind:iconColor
					bind:bgColor
					bind:bgColorOpacity
					bind:linkColor
					bind:useOriginalIconColor
					onColorChange={handleColorChange}
				/>
			</TabsContent>

			<TabsContent value="style">
				<ShadowSettings
					bind:shadowTarget
					{textShadow}
					{iconShadow}
					onUpdateShadow={updateShadow}
				/>
			</TabsContent>

			<TabsContent value="export">
				<ExportSettings
					bind:ratios
					bind:exportConfig
					{canvasWidth}
					{canvasHeight}
					{activeRatios}
					onExport={doExport}
				/>
			</TabsContent>
		</Root>
	</div>
</div>

<style>
	.cover-layout {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	@media (min-width: 1024px) {
		.cover-layout {
			flex-direction: row;
			gap: 1.5rem;
			align-items: flex-start;
		}

		.cover-preview-col {
			flex: 1;
			position: sticky;
			top: 1.5rem;
		}

		.cover-settings-col {
			width: 420px;
			flex-shrink: 0;
			max-height: calc(100vh - 3rem);
			overflow-y: auto;
			padding-right: 0.25rem;
		}
	}

	@media (min-width: 1280px) {
		.cover-settings-col {
			width: 480px;
		}
	}

	.cover-preview-col {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.export-bar {
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.cover-settings-col {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.cover-settings-col :global([data-slot="tabs-content"]) {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding-top: 0.75rem;
	}

	.cover-settings-col :global([data-slot="tabs-list"]) {
		flex-wrap: wrap;
	}

	.cover-settings-col :global([data-slot="card"]) {
		padding: 0;
		gap: 0;
	}

	.cover-settings-col :global([data-slot="card-header"]) {
		padding: 0.75rem 1rem 0.25rem;
	}

	.cover-settings-col :global([data-slot="card-content"]) {
		padding: 0.5rem 1rem 1rem;
	}

	.cover-settings-col :global([data-slot="card-title"]) {
		font-size: 0.875rem;
		font-weight: 600;
	}

	.cover-settings-col :global([data-slot="tabs-trigger"]) {
		font-size: 0.8125rem;
		gap: 0.25rem;
		padding: 0.5rem 0.75rem;
	}

	.cover-settings-col::-webkit-scrollbar {
		width: 4px;
	}

	.cover-settings-col::-webkit-scrollbar-track {
		background: transparent;
	}

	.cover-settings-col::-webkit-scrollbar-thumb {
		background: hsl(var(--border));
		border-radius: 2px;
	}
</style>
