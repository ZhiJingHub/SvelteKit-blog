export const siteConfig = {
	name: 'My Blog',
	title: 'My Blog',
	subtitle: 'A personal blog',
	url: 'https://example.com',
	icon: '/favicon.svg',
	description: '一个专注于技术分享的个人博客',
	keywords: ['blog', 'tech', '技术博客'],
	lang: 'zh_CN',
	ogImage: '/og-image.svg',
	author: {
		name: 'Author',
		url: 'https://example.com'
	},
	bio: {
		avatar: '/avatar.svg',
		name: 'Author Name',
		bio: 'Stay hungry, stay foolish.',
		links: [
			{
				name: 'GitHub',
				icon: 'simple-icons:github',
				url: 'https://github.com',
				color: '#333333'
			}
		]
	},
	navLinks: [
		{ label: '博客', icon: 'mdi:post-outline', href: '/posts' },
		{ label: '封面制作', icon: 'mdi:image-edit', href: '/cover' },
		{ label: '隐藏图', icon: 'mdi:layers-triple', href: '/ptg' },
		{ label: '友链', icon: 'mdi:link-variant', href: '/friends' },
		{ label: '统计', icon: 'mdi:chart-line', href: 'https://u.iwexe.top/share/iAHxxL5xADM8Ll43' }
	] as const
};

export type SiteConfig = typeof siteConfig;
