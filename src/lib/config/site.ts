export const siteConfig = {
	name: 'My Blog',
	title: 'My Blog',
	subtitle: 'A personal blog',
	url: 'https://iwexe.top',
	icon: '/favicon.svg',
	description: '一个专注于技术分享的个人博客',
	keywords: ['blog', 'tech', '技术博客'],
	lang: 'zh_CN',
	ogImage: '/og-image.svg',
	author: {
		name: '致靖',
		url: 'https://iwexe.top'
	},
	bio: {
		avatar: '/avatar.svg',
		name: '致靖',
		bio: 'Stay hungry, stay foolish.',
		links: [
			{
				name: 'GitHub',
				icon: 'simple-icons:github',
				url: 'https://github.com/ZhiJingHub',
				color: '#333333'
			},
			{
				name: 'Telegram',
				icon: 'simple-icons:telegram',
				url: 'https://t.me/ZhiJing_PM_Bot',
				color: '#0088cc'
			},
			{
				name: '邮箱',
				icon: 'mdi:email-outline',
				url: 'mailto:me@iwexe.top'
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
