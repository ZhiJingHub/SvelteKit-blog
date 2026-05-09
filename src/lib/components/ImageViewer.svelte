<script lang="ts">
	import { onMount } from 'svelte';
	import PhotoSwipeLightbox from 'photoswipe/lightbox';
	import 'photoswipe/style.css';

	onMount(() => {
		const lightbox = new PhotoSwipeLightbox({
			gallery: '.prose',
			children: 'img',
			pswpModule: () => import('photoswipe')
		});

		lightbox.addFilter('itemData', (itemData, index) => {
			const img = itemData.element as HTMLImageElement;
			return {
				src: img.src,
				width: img.naturalWidth || 800,
				height: img.naturalHeight || 600,
				alt: img.alt || ''
			};
		});

		lightbox.on('uiRegister', () => {
			const images = document.querySelectorAll('.prose img');
			images.forEach((img) => {
				(img as HTMLElement).style.cursor = 'pointer';
			});
		});

		lightbox.init();

		return () => {
			lightbox.destroy();
		};
	});
</script>
