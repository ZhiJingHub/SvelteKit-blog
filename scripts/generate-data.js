import fs from 'fs';
import path from 'path';

const outputDir = path.join(process.cwd(), 'src/lib/data');

if (!fs.existsSync(outputDir)) {
	fs.mkdirSync(outputDir, { recursive: true });
}

const data = {};

fs.writeFileSync(
	path.join(outputDir, 'static-data.ts'),
	`export const staticData = ${JSON.stringify(data, null, 2)};`
);

console.log('[generate-data] Static data generated successfully');
