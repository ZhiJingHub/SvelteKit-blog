<script lang="ts">
	import { onMount } from 'svelte';
	import CoverPreview from './cover/CoverPreview.svelte';
	import TextSettings from './cover/TextSettings.svelte';
	import IconSettings from './cover/IconSettings.svelte';
	import BackgroundSettings from './cover/BackgroundSettings.svelte';
	import SizeSettings from './cover/SizeSettings.svelte';
	import ColorSettings from './cover/ColorSettings.svelte';
	import IconBackgroundSettings from './cover/IconBackgroundSettings.svelte';
	import ShadowSettings from './cover/ShadowSettings.svelte';
	import ExportSettings from './cover/ExportSettings.svelte';
	import * as Tabs from '$lib/components/ui/tabs';

	let leftText = $state('鸣潮');
	let rightText = $state('牛逼');
	let fontWeight = $state(400);
	let iconName = $state('arcticons:wuthering-waves');
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
	let searchAbort: AbortController | null = null;

	let fontSize = $state(64);
	let customFont = $state<string | null>(null);
	let customFontName = $state('');
	let gap = $state(20);

	let color = $state('#000000');
	let bgColor = $state('#ffffff');
	let bgColorOpacity = $state(1);
	let linkColor = $state(true);

	let textShadow = $state({ x: 0, y: 0, blur: 0, color: '#000000', alpha: 0 });
	let iconShadow = $state({ x: 0, y: 0, blur: 0, color: '#000000', alpha: 0 });
	let shadowTarget = $state<string>('both');

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

	let ratios = $state([{ label: '1:1', w: 1, h: 1, checked: false }, { label: '4:3', w: 4, h: 3, checked: false }, { label: '16:9', w: 16, h: 9, checked: true }, { label: '21:9', w: 21, h: 9, checked: false }]);

	let linkScale = $state(true);
	let lastFontSize = $state(64);
	let lastIconSize = $state(64);

	let exportConfig = $state({ format: 'png' as 'png' | 'svg', scales: [1] as number[], filename: 'cover', transparentBg: false, exportRatios: [] as string[] });

	let svgContainer: SVGSVGElement | undefined = $state();
	let dragStartX = 0; let dragStartY = 0; let initialImageX = 0; let initialImageY = 0;
	let activePointers = new Map<number, { x: number; y: number }>();
	let initialPinchDistance = 0; let initialScale = 1;

	const BASE_HEIGHT = 600;
	let activeRatios = $derived(ratios.filter(r => r.checked));
	let visualRatios = $derived(activeRatios.length > 0 ? activeRatios : [ratios[2]]);
	let maxWidthRatio = $derived(visualRatios.reduce((max, r) => (r.w / r.h > max ? r.w / r.h : max), 0));
	let canvasWidth = $derived(Math.round(BASE_HEIGHT * maxWidthRatio));
	let canvasHeight = $derived(BASE_HEIGHT);

	function hexToRgba(hex: string, alpha: number) {
		const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
		return `rgba(${r}, ${g}, ${b}, ${alpha})`;
	}

	function updateShadow(key: string, value: string | number) {
		if (shadowTarget === 'both' || shadowTarget === 'text') textShadow = { ...textShadow, [key]: value };
		if (shadowTarget === 'both' || shadowTarget === 'icon') iconShadow = { ...iconShadow, [key]: value };
	}

	function handleColorChange(newColor: string, type: 'text' | 'icon') {
		if (type === 'text') { color = newColor; if (linkColor) iconColor = newColor; }
		else { iconColor = newColor; if (linkColor) color = newColor; }
	}

	function handleFontSizeChange(value: number[]) {
		const n = value[0];
		if (linkScale) { const r = n / lastFontSize; iconSize = Math.round(iconSize * r); lastIconSize = iconSize; }
		fontSize = n; lastFontSize = n;
	}

	function handleIconSizeChange(value: number[]) {
		const n = value[0];
		if (linkScale) { const r = n / lastIconSize; fontSize = Math.round(fontSize * r); lastFontSize = fontSize; }
		iconSize = n; lastIconSize = n;
	}

	function loadBgImageFile(file: File) {
		if (!file.type.startsWith('image/')) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			bgImage = e.target?.result as string;
			const img = new Image();
			img.onload = () => {
				const fitScale = Math.min(canvasWidth / img.naturalWidth, canvasHeight / img.naturalHeight);
				bgImageScale = Math.max(fitScale, 0.1);
				bgImageX = (canvasWidth - img.naturalWidth * bgImageScale) / 2;
				bgImageY = (canvasHeight - img.naturalHeight * bgImageScale) / 2;
				bgBlur = 0; bgOpacity = 1;
			};
			img.src = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	function handleBgImageUpload(e: Event) { const file = (e.target as HTMLInputElement).files?.[0]; if (file) loadBgImageFile(file); }

	function handleFontUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => {
			const data = e.target?.result as ArrayBuffer;
			customFontName = file.name.replace(/\.[^/.]+$/, '');
			customFont = URL.createObjectURL(new Blob([data]));
			const ff = new FontFace(customFontName, `url(${customFont})`);
			ff.load().then(f => document.fonts.add(f));
		};
		reader.readAsArrayBuffer(file);
	}

	function handleSystemFontSelect(fontName: string) { customFontName = fontName; customFont = null; }

	async function handleSearch() {
		if (searchAbort) searchAbort.abort();
		if (!searchQuery) { searchResults = []; return; }
		isSearching = true;
		searchAbort = new AbortController();
		try {
			const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(searchQuery)}&limit=20`, { signal: searchAbort.signal });
			const data = await res.json();
			searchResults = data.icons || [];
		} catch { if (!searchAbort?.signal.aborted) searchResults = []; }
		isSearching = false;
	}

	function onSearchInput(e: Event) {
		searchQuery = (e.target as HTMLInputElement).value;
		clearTimeout(searchDebounce);
		searchDebounce = setTimeout(() => handleSearch(), searchQuery.trim() ? 500 : 0);
	}

	function handleLocalIconUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (e) => { localIcon = e.target?.result as string; iconName = '本地图片'; iconSvg = ''; };
		reader.readAsDataURL(file);
	}

	function selectIcon(icon: string) { iconName = icon; localIcon = null; }

	function handleBgDragOver(e: DragEvent) { e.preventDefault(); isBgDragOver = true; }
	function handleBgDragLeave(e: DragEvent) { e.preventDefault(); isBgDragOver = false; }
	function handleBgDrop(e: DragEvent) { e.preventDefault(); isBgDragOver = false; const file = e.dataTransfer?.files?.[0]; if (file) loadBgImageFile(file); }

	function handlePointerDown(e: PointerEvent) {
		if (!bgImage) return; e.preventDefault();
		(e.currentTarget as Element).setPointerCapture(e.pointerId);
		activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		if (activePointers.size === 1) { isDragging = true; dragStartX = e.clientX; dragStartY = e.clientY; initialImageX = bgImageX; initialImageY = bgImageY; }
		else if (activePointers.size === 2) { isDragging = false; const pts = Array.from(activePointers.values()); initialPinchDistance = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y); initialScale = bgImageScale; }
	}

	function handlePointerMove(e: PointerEvent) {
		if (!bgImage || !activePointers.has(e.pointerId)) return; e.preventDefault();
		activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
		if (activePointers.size === 2) { const pts = Array.from(activePointers.values()); const d = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y); if (initialPinchDistance > 0) bgImageScale = Math.max(0.1, Math.min(initialScale * d / initialPinchDistance, 10)); }
		else if (activePointers.size === 1 && isDragging) { bgImageX = initialImageX + (e.clientX - dragStartX) / bgImageScale; bgImageY = initialImageY + (e.clientY - dragStartY) / bgImageScale; }
	}

	function handlePointerUp(e: PointerEvent) { activePointers.delete(e.pointerId); (e.currentTarget as Element).releasePointerCapture(e.pointerId); if (activePointers.size < 2) initialPinchDistance = 0; if (activePointers.size === 0) isDragging = false; }

	function handleWheel(e: WheelEvent) {
		if (!bgImage) return;
		e.preventDefault();
		const cx = canvasWidth / 2;
		const cy = canvasHeight / 2;
		const oldScale = bgImageScale;
		const newScale = e.deltaY < 0 ? Math.min(oldScale * 1.1, 10) : Math.max(oldScale / 1.1, 0.1);
		const ratio = newScale / oldScale;
		bgImageX = cx - (cx - bgImageX) * ratio;
		bgImageY = cy - (cy - bgImageY) * ratio;
		bgImageScale = newScale;
	}

	async function doExport() {
		if (!svgContainer) return;
		const guides = svgContainer.querySelectorAll('.ratio-guide');
		for (const g of guides) (g as SVGElement).style.display = 'none';
		const border = svgContainer.querySelector('.canvas-border');
		if (border) (border as SVGElement).style.display = 'none';
		const svgClone = svgContainer.cloneNode(true) as SVGSVGElement;
		const ratiosToExport = exportConfig.exportRatios.length > 0 ? ratios.filter(r => exportConfig.exportRatios.includes(r.label)) : activeRatios;
		for (const ratio of ratiosToExport) {
			const rw = Math.round(BASE_HEIGHT * (ratio.w / ratio.h)), rh = BASE_HEIGHT;
			const xOff = (canvasWidth - rw) / 2;
			const clone = svgClone.cloneNode(true) as SVGSVGElement;
			clone.setAttribute('width', rw.toString()); clone.setAttribute('height', rh.toString());
			clone.setAttribute('viewBox', `${xOff} 0 ${rw} ${rh}`);
			const svgData = new XMLSerializer().serializeToString(clone);
			const name = activeRatios.length > 1 ? `${exportConfig.filename}-${ratio.label.replace(':', '-')}` : exportConfig.filename;
			if (exportConfig.format === 'svg') { const b = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' }); downloadLink(URL.createObjectURL(b), `${name}.svg`); }
			else {
				const img = new Image();
				const bytes = new TextEncoder().encode(svgData);
				const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
				img.src = `data:image/svg+xml;base64,${btoa(binary)}`;
				await new Promise<void>(r => { img.onload = () => r(); });
				for (const sc of (exportConfig.scales.length > 0 ? exportConfig.scales : [1])) {
					const c = document.createElement('canvas'); c.width = rw * sc; c.height = rh * sc;
					const ctx = c.getContext('2d'); if (!ctx) continue;
					ctx.imageSmoothingEnabled = true;
					ctx.imageSmoothingQuality = 'high';
					ctx.drawImage(img, 0, 0, c.width, c.height);
					downloadLink(c.toDataURL('image/png'), `${name}${exportConfig.scales.length > 1 ? `@${sc}x` : ''}.png`);
				}
			}
		}
		for (const g of guides) (g as SVGElement).style.display = '';
		if (border) (border as SVGElement).style.display = '';
	}

	function downloadLink(url: string, filename: string) { const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); document.body.removeChild(a); }

	$effect(() => {
		if (iconName?.includes(':')) {
			const [prefix, name] = iconName.split(':');
			fetch(`https://api.iconify.design/${prefix}/${name}.svg`)
				.then(r => r.text())
				.then(svg => {
					let s = svg.replace(/width="[^"]*"/g, '').replace(/height="[^"]*"/g, '');
					s = s.replace(/<svg\b([^>]*)>/, '<svg$1 width="100%" height="100%" preserveAspectRatio="xMidYMid meet">');
					if (!useOriginalIconColor) s = s.replace(/fill="[^"]*"/g, 'fill="currentColor"');
					iconSvg = s;
				}).catch(() => { iconSvg = ''; });
		} else { iconSvg = ''; }
	});

	onMount(() => {
		bgColor = '#ffffff';
		color = '#000000';
		iconColor = '#000000';
	});
</script>

<div class="flex flex-col lg:flex-row gap-6 w-full">
	<div class="flex-1 lg:max-w-[55%]">
		<div class="lg:sticky lg:top-20">
			<CoverPreview bind:svgContainer {canvasWidth} {canvasHeight} {visualRatios} {bgImage} {bgImageX} {bgImageY} {bgImageScale} {bgBlur} {bgOpacity} {bgColor} {bgColorOpacity} {leftText} {rightText} {fontSize} {fontWeight} {customFontName} {color} {textShadow} {gap} {showIcon} {iconSvg} {localIcon} {iconSize} {iconBgPadding} {iconBgEnabled} {iconBgColor} {iconBgOpacity} {iconBgBlur} {iconBgRadius} {useOriginalIconColor} {iconColor} {iconShadow} {iconRadius} {isDragging} {hexToRgba} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onWheel={handleWheel} />
		</div>
	</div>
	<div class="w-full lg:flex-1">
		<div class="lg:hidden">
			<Tabs.Root value="content" class="w-full">
				<Tabs.List class="grid w-full grid-cols-3">
					<Tabs.Trigger value="content">内容</Tabs.Trigger>
					<Tabs.Trigger value="style">样式</Tabs.Trigger>
					<Tabs.Trigger value="export">导出</Tabs.Trigger>
				</Tabs.List>
				<Tabs.Content value="content" class="space-y-6 mt-6">
					<TextSettings bind:leftText bind:rightText bind:fontWeight bind:customFontName onFontUpload={handleFontUpload} onSystemFontSelect={handleSystemFontSelect} onRemoveFont={() => { customFont = null; customFontName = ''; }} />
					<IconSettings bind:showIcon bind:localIcon bind:searchQuery bind:searchResults bind:iconName {isSearching} onLocalIconUpload={handleLocalIconUpload} {onSearchInput} onSelectIcon={selectIcon} />
					<BackgroundSettings bind:bgImage bind:bgBlur bind:bgOpacity bind:isBgDragOver onBgImageUpload={handleBgImageUpload} onBgDragOver={handleBgDragOver} onBgDragLeave={handleBgDragLeave} onBgDrop={handleBgDrop} />
				</Tabs.Content>
				<Tabs.Content value="style" class="space-y-6 mt-6">
					<SizeSettings bind:fontSize bind:iconSize bind:iconRadius bind:gap bind:linkScale onFontSizeChange={handleFontSizeChange} onIconSizeChange={handleIconSizeChange} />
					<ColorSettings bind:color bind:iconColor bind:bgColor bind:bgColorOpacity bind:linkColor bind:useOriginalIconColor onColorChange={handleColorChange} />
					<IconBackgroundSettings bind:iconBgEnabled bind:iconBgColor bind:iconBgPadding bind:iconBgRadius bind:iconBgBlur bind:iconBgOpacity />
					<ShadowSettings bind:shadowTarget {textShadow} {iconShadow} onUpdateShadow={updateShadow} />
				</Tabs.Content>
				<Tabs.Content value="export" class="space-y-6 mt-6">
					<ExportSettings bind:ratios bind:exportConfig {activeRatios} canvasWidth={canvasWidth} canvasHeight={canvasHeight} onExport={doExport} />
				</Tabs.Content>
			</Tabs.Root>
		</div>
		<div class="hidden lg:grid lg:grid-cols-3 gap-6">
			<div class="space-y-6">
				<h2 class="text-lg font-semibold mb-4">内容</h2>
				<TextSettings bind:leftText bind:rightText bind:fontWeight bind:customFontName onFontUpload={handleFontUpload} onSystemFontSelect={handleSystemFontSelect} onRemoveFont={() => { customFont = null; customFontName = ''; }} />
				<IconSettings bind:showIcon bind:localIcon bind:searchQuery bind:searchResults bind:iconName {isSearching} onLocalIconUpload={handleLocalIconUpload} {onSearchInput} onSelectIcon={selectIcon} />
				<BackgroundSettings bind:bgImage bind:bgBlur bind:bgOpacity bind:isBgDragOver onBgImageUpload={handleBgImageUpload} onBgDragOver={handleBgDragOver} onBgDragLeave={handleBgDragLeave} onBgDrop={handleBgDrop} />
			</div>
			<div class="space-y-6">
				<h2 class="text-lg font-semibold mb-4">样式</h2>
				<SizeSettings bind:fontSize bind:iconSize bind:iconRadius bind:gap bind:linkScale onFontSizeChange={handleFontSizeChange} onIconSizeChange={handleIconSizeChange} />
				<ColorSettings bind:color bind:iconColor bind:bgColor bind:bgColorOpacity bind:linkColor bind:useOriginalIconColor onColorChange={handleColorChange} />
				<IconBackgroundSettings bind:iconBgEnabled bind:iconBgColor bind:iconBgPadding bind:iconBgRadius bind:iconBgBlur bind:iconBgOpacity />
				<ShadowSettings bind:shadowTarget {textShadow} {iconShadow} onUpdateShadow={updateShadow} />
			</div>
			<div class="space-y-6">
				<h2 class="text-lg font-semibold mb-4">导出</h2>
				<ExportSettings bind:ratios bind:exportConfig {activeRatios} canvasWidth={canvasWidth} canvasHeight={canvasHeight} onExport={doExport} />
			</div>
		</div>
	</div>
</div>
