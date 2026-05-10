// @ts-nocheck
const CONVERTIBLE_RE = /\.(png|jpe?g|webp)(?=$|[?#])/i;

function rewriteUrl(url) {
	if (typeof url !== 'string') return url;
	if (/^(https?:)?\/\//i.test(url)) return url;
	if (!CONVERTIBLE_RE.test(url)) return url;
	return url.replace(CONVERTIBLE_RE, '.avif');
}

function visit(node, type, fn) {
	if (!node || typeof node !== 'object') return;
	if (Array.isArray(node)) {
		for (const c of node) visit(c, type, fn);
		return;
	}
	if (node.type === type) fn(node);
	if (node.children) visit(node.children, type, fn);
}

export default function remarkAvifRewrite() {
	return (tree, file) => {
		if (process.env.NODE_ENV !== 'production') return;

		visit(tree, 'image', (node) => {
			node.url = rewriteUrl(node.url);
		});

		visit(tree, 'html', (node) => {
			if (typeof node.value !== 'string') return;
			node.value = node.value
				.replace(/(<img[^>]+src=["'])([^"']+)(["'])/gi, (_, p1, src, p3) => p1 + rewriteUrl(src) + p3)
				.replace(/(<source[^>]+srcset=["'])([^"']+)(["'])/gi, (_, p1, src, p3) => p1 + rewriteUrl(src) + p3);
		});

		const fm = file?.data?.fm;
		if (fm && typeof fm.image === 'string') {
			fm.image = rewriteUrl(fm.image);
		}
	};
}
