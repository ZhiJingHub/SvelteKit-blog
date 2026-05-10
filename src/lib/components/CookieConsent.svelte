<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import * as Dialog from '$lib/components/ui/dialog';
	import Icon from '@iconify/svelte';

	interface ConsentPreferences {
		necessary: boolean;
		analytics: boolean;
	}

	let showBanner = $state(false);
	let showSettings = $state(false);

	let preferences = $state<ConsentPreferences>({
		necessary: true,
		analytics: false
	});

	const STORAGE_KEY = 'cookie-consent-preferences';
	const CONSENT_VERSION = '1.0';

	onMount(() => {
		loadPreferences();
		const handler = (e: Event) => {
			const t = e.target as HTMLElement;
			if (t.id === 'open_preferences_center' || t.closest('#open_preferences_center')) {
				e.preventDefault();
				showSettings = true;
			}
		};
		document.addEventListener('click', handler);
		return () => document.removeEventListener('click', handler);
	});

	function loadPreferences() {
		try {
			const s = localStorage.getItem(STORAGE_KEY);
			if (s) {
				const d = JSON.parse(s);
				if (d.version === CONSENT_VERSION) {
					preferences = d.preferences;
					applyConsent();
					return;
				}
			}
		} catch { /* corrupted */ }
		showBanner = true;
	}

	function savePreferences() {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: CONSENT_VERSION, preferences, timestamp: Date.now() }));
		} catch { /* quota exceeded */ }
	}

	function acceptAll() {
		preferences = { necessary: true, analytics: true };
		savePreferences();
		applyConsent();
		showBanner = false;
		showSettings = false;
	}

	function acceptNecessary() {
		preferences = { necessary: true, analytics: false };
		savePreferences();
		applyConsent();
		showBanner = false;
		showSettings = false;
	}

	function saveCustomPreferences() {
		preferences.necessary = true;
		savePreferences();
		applyConsent();
		showBanner = false;
		showSettings = false;
	}

	function applyConsent() {
		window.dispatchEvent(new CustomEvent('cookie-consent-updated', { detail: preferences }));
	}
</script>

{#if showBanner}
	<div class="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
		<div class="fixed bottom-0 left-0 right-0 p-4 md:p-6">
			<Card class="mx-auto max-w-3xl">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<Icon icon="mdi:cookie" class="h-5 w-5" />
						Cookie 使用说明
					</CardTitle>
					<CardDescription>
						我们使用 Cookie 来改善您的浏览体验和进行网站统计分析。
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-4">
						<p class="text-sm text-muted-foreground">
							点击"接受全部"即表示您同意我们使用所有 Cookie。您也可以点击"自定义设置"来选择您希望启用的 Cookie 类型。
						</p>
						<div class="flex flex-wrap gap-3">
							<Button onclick={acceptAll}><Icon icon="mdi:check-all" class="mr-2 h-4 w-4" />接受全部</Button>
							<Button variant="outline" onclick={acceptNecessary}>仅必要 Cookie</Button>
							<Button variant="outline" onclick={() => showSettings = true}><Icon icon="mdi:cog" class="mr-2 h-4 w-4" />自定义设置</Button>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	</div>
{/if}

<Dialog.Root bind:open={showSettings}>
	<Dialog.Content class="max-w-2xl max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>Cookie 偏好设置</Dialog.Title>
			<Dialog.Description>选择您希望启用的 Cookie 类型。必要 Cookie 无法禁用。</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-6 py-4">
			<div class="space-y-3">
				<div class="flex items-start gap-3">
					<Checkbox checked={true} disabled={true} class="mt-1" />
					<div class="flex-1">
						<h3 class="font-semibold">必要 Cookie</h3>
						<p class="text-sm text-muted-foreground mt-1">网站基本功能必需，无法禁用。</p>
						<ul class="text-sm text-muted-foreground space-y-1 list-disc list-inside mt-1">
							<li>Umami Analytics - 隐私友好的站点统计</li>
						</ul>
					</div>
				</div>
			</div>
			<div class="space-y-3">
				<div class="flex items-start gap-3">
					<Checkbox bind:checked={preferences.analytics} class="mt-1" />
					<div class="flex-1">
						<h3 class="font-semibold">分析 Cookie</h3>
						<p class="text-sm text-muted-foreground mt-1">了解访问者使用方式，改进体验。</p>
					</div>
				</div>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={acceptNecessary}>仅必要</Button>
			<Button onclick={saveCustomPreferences}>保存设置</Button>
			<Button onclick={acceptAll}>接受全部</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
