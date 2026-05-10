import adapter from '@sveltejs/adapter-cloudflare';
import { mdsvex } from 'mdsvex';
import mdsvexConfig from './src/lib/config/mdsvex.config.js';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	extensions: ['.svelte', '.md'],
	preprocess: [mdsvex(mdsvexConfig)],
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	onwarn: (warning, handler) => {
		if (warning.code.startsWith('a11y_')) return;
		if (warning.code === 'script_context_deprecated') return;
		handler(warning);
	},
	kit: {
		adapter: adapter(),
		prerender: {
			handleHttpError: ({ path, message }) => {
				console.warn(`[prerender] HTTP error at ${path}: ${message}`);
			},
			handleMissingId: ({ path, id }) => {
				console.warn(`[prerender] missing id "${id}" at ${path}`);
			},
			handleUnseenRoutes: 'ignore'
		}
	}
};

export default config;
