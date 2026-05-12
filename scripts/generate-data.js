// @ts-nocheck
import fs from 'fs';
import path from 'path';

const postsDir = path.join(process.cwd(), 'src/content/posts');
const outputDir = path.join(process.cwd(), 'src/lib/data');

function countWords(text) {
	const plain = text.replace(/<[^>]*>/g, '');
	const chinese = plain.match(/[\u4e00-\u9fa5]/g) || [];
	const english = plain.match(/[a-zA-Z]+/g) || [];
	return chinese.length + english.length;
}

function calculateReadTime(wordCount) {
	return Math.max(1, Math.ceil(wordCount / 300));
}

const stats = {};

if (fs.existsSync(postsDir)) {
	const slugs = fs.readdirSync(postsDir).filter(d => {
		const mdPath = path.join(postsDir, d, 'index.md');
		return fs.existsSync(mdPath);
	});

	for (const slug of slugs) {
		const mdPath = path.join(postsDir, slug, 'index.md');
		const raw = fs.readFileSync(mdPath, 'utf-8');

		let body = raw;
		if (body.startsWith('---')) {
			const end = body.indexOf('---', 3);
			if (end !== -1) body = body.slice(end + 3);
		}
		body = body.replace(/^#{1,6}\s+.*$/gm, '');
		body = body.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
		body = body.replace(/[!>|`#*~_\-\t]/g, ' ');

		const wc = countWords(body);
		stats[slug] = { wordCount: wc, readTime: calculateReadTime(wc) };
	}
}

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

const fileContent = `export const postStats: Record<string, { wordCount: number; readTime: number }> = ${JSON.stringify(stats, null, 2)};\n`;

fs.writeFileSync(path.join(outputDir, 'post-stats.ts'), fileContent);
console.log(`[generate-data] Pre-computed word counts for ${Object.keys(stats).length} posts`);
