export const siteConfig = {
	name: "ZhiJing\u2019s Blog",
	title: "ZhiJing\u2019s Blog",
	subtitle: 'A personal blog',
	url: 'https://iwexe.top',
	icon: '/favicon.svg',
	description: '这里没有固定内容与题材，随心记录生活日常、所思所想、各类见闻杂谈，分享平淡日子里的点滴思绪',
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
		bio: 'Go with the flow.',
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
