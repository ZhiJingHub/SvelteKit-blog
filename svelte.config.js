import adapter from '@sveltejs/adapter-static';
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
		adapter: adapter({
			fallback: '404.html',
			strict: false
		}),
		prerender: {
			entries: ['*', '/robots.txt'],
			handleHttpError: ({ path, referrer, message }) => {
				if (path.endsWith('.avif')) return;
				console.warn(`[prerender] HTTP error at ${path} (from ${referrer}): ${message}`);
			},
			handleMissingId: ({ path, id, referrers }) => {
				console.warn(`[prerender] missing id "${id}" at ${path} (from ${referrers.join(', ')})`);
			},
			handleEntryGeneratorMismatch: ({ entry, generatedFromId, matchedId }) => {
				console.warn(`[prerender] entry mismatch: ${entry} (from ${generatedFromId}, matched ${matchedId})`);
			}
		},
		paths: {
			base: process.env.NODE_ENV === 'production' ? '' : ''
		}
	}
};

export default config;
