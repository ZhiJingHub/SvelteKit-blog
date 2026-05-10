<script lang="ts">
	import Icon from '@iconify/svelte';
	import { themeMode, type ThemeMode } from '$lib/stores/theme';

	const modes: ThemeMode[] = ['light', 'dark', 'system'];

	function cycle() {
		themeMode.update((cur) => {
			const idx = modes.indexOf(cur);
			return modes[(idx + 1) % modes.length];
		});
	}

	let currentMode = $state<ThemeMode>('system');
	$effect(() => {
		currentMode = $themeMode;
	});

	let icon = $derived(
		currentMode === 'light' ? 'mdi:weather-sunny' :
		currentMode === 'dark' ? 'mdi:weather-night' :
		'mdi:monitor'
	);

	let label = $derived(
		currentMode === 'light' ? '浅色模式' :
		currentMode === 'dark' ? '深色模式' :
		'跟随系统'
	);
</script>

<button
	onclick={cycle}
	class="inline-flex items-center justify-center rounded-md w-9 h-9 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
	aria-label={label}
	title={label}
>
	<Icon icon={icon} class="w-5 h-5" />
</button>
