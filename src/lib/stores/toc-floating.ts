import { writable } from 'svelte/store';

const open = writable(false);
const available = writable(false);

export const tocFloating = {
	subscribe: open.subscribe,
	available,
	toggle: () => open.update(v => !v),
	setOpen: (v: boolean) => open.set(v),
	setAvailable: (v: boolean) => available.set(v),
	reset: () => open.set(false)
};
