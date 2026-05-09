<script lang="ts">
	import { onMount } from 'svelte';

	let { container }: { container: HTMLDivElement | undefined } = $props();

	let gallery: HTMLDivElement | undefined = $state();

	let initialized = $state(false);

	function initGallery() {
		if (initialized || !container) return;
		initialized = true;

		import('photoswipe').then(async (mod) => {
			const PhotoSwipe = mod.default;
			const PhotoSwipeLightbox = (await import('photoswipe/lightbox')).default;

			if (!gallery) return;

			const lightbox = new PhotoSwipeLightbox({
				gallery,
				children: 'a[data-pswp]',
				pswpModule: PhotoSwipe
			});

			lightbox.init();

			const images = container.querySelectorAll('img');
			images.forEach((img) => {
				const parent = img.parentElement;
				if (parent && parent.tagName === 'A' && parent.hasAttribute('data-pswp')) return;

				const src = img.getAttribute('src');
				if (!src) return;

				const a = document.createElement('a');
				a.href = src;
				a.setAttribute('data-pswp', '');
				a.setAttribute('data-pswp-width', String(img.naturalWidth || 1200));
				a.setAttribute('data-pswp-height', String(img.naturalHeight || 800));

				const alt = img.getAttribute('alt');
				if (alt) {
					a.setAttribute('data-pswp-caption', alt);
				}

				img.parentNode?.insertBefore(a, img);
				a.appendChild(img);
			});
		});
	}

	onMount(() => {
		initGallery();
	});

	$effect(() => {
		if (container) initGallery();
	});
</script>

<div bind:this={gallery} class="hidden" aria-hidden="true"></div>
