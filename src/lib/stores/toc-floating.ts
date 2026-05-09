import { writable } from 'svelte/store';
import { browser } from '$app/environment';

export const tocFloating = (() => {
	const open = writable(false);
	let available = writable(true);

	function toggle() {
		open.update(v => !v);
	}

	function setAvailable(v: boolean) {
		available.set(v);
	}

	return {
		subscribe: open.subscribe,
		toggle,
		open,
		available,
		setAvailable
	};
})();
