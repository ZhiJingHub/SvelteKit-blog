import { defineMDSveXConfig as defineConfig } from 'mdsvex';
import remarkAvifRewrite from '../../../vite-plugins/remark-avif-rewrite.js';
import remarkGithubAlerts from '../../../vite-plugins/remark-github-alerts.js';
import remarkKatex from '../../../vite-plugins/remark-katex.js';
import rehypeExternalLinks from '../../../vite-plugins/rehype-external-links.js';
import rehypePrettyCode from 'rehype-pretty-code';

const config = defineConfig({
	extensions: ['.md'],
	smartypants: {
		dashes: 'oldschool'
	},
	remarkPlugins: [remarkKatex, remarkGithubAlerts, remarkAvifRewrite],
	rehypePlugins: [rehypeExternalLinks, [rehypePrettyCode, { theme: 'github-dark' }]]
});

export default config;
