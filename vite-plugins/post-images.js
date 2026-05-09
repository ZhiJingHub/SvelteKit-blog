import fs from 'fs';
import path from 'path';

export function postImagesPlugin() {
	return {
		name: 'post-images',
		apply: 'serve',
		configureServer(server) {
			server.middlewares.use('/posts', (req, res, next) => {
				const urlPath = req.url;
				const match = urlPath.match(/^\/([^\/]+)\/img\/(.+)$/);
				if (match) {
					const [, slug, filename] = match;
					const imagePath = path.join(process.cwd(), 'src/content/posts', slug, 'img', filename);

					if (fs.existsSync(imagePath)) {
						const stat = fs.statSync(imagePath);
						const ext = path.extname(filename).toLowerCase();

						const mimeTypes = {
							'.webp': 'image/webp',
							'.png': 'image/png',
							'.jpg': 'image/jpeg',
							'.jpeg': 'image/jpeg',
							'.gif': 'image/gif',
							'.svg': 'image/svg+xml',
							'.avif': 'image/avif'
						};

						res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
						res.setHeader('Content-Length', stat.size);

						const stream = fs.createReadStream(imagePath);
						stream.pipe(res);
						return;
					}
				}

				next();
			});
		}
	};
}
