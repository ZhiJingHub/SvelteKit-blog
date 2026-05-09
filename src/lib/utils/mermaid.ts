let mermaidModule: unknown = null;

async function getMermaid() {
	if (mermaidModule !== null) return mermaidModule;
	try {
		mermaidModule = await new Function('return import("mermaid")')();
	} catch {
		mermaidModule = undefined;
	}
	return mermaidModule;
}

export async function renderMermaidIn(container: HTMLElement) {
	const mermaidEls = container.querySelectorAll('pre code.language-mermaid');
	if (mermaidEls.length === 0) return;

	try {
		const mod = await getMermaid();
		if (!mod) return;
		const mermaid = (mod as { default: any }).default;

		mermaid.initialize({
			startOnLoad: false,
			theme: 'default',
			securityLevel: 'loose'
		});

		for (const el of mermaidEls) {
			const pre = el.parentElement;
			if (!pre) continue;

			const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`;
			const div = document.createElement('div');
			div.className = 'mermaid';
			div.id = id;
			div.textContent = el.textContent || '';
			pre.replaceWith(div);
		}

		await mermaid.run({ querySelector: '.mermaid' });
	} catch {
		// mermaid not available
	}
}
