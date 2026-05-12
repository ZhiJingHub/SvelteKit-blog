# 致靖的博客

基于 SvelteKit + Tailwind CSS + shadcn-svelte 的个人博客，部署于 Cloudflare Workers。

## 功能

- **博客系统** — Markdown/MDX 写作，支持代码高亮、KaTeX 数学公式、Mermaid 图表
- **封面制作** — 在线 SVG 封面生成器，支持文本/图标/背景图、多比例画板、PNG/SVG 导出
- **友链系统** — JSON 文件自动扫描加载，GitHub Issue + Actions 自动审核
- **隐藏图工具** — 图片隐写，拉高曝光显现隐藏内容
- **浏览量统计** — Cloudflare Workers KV 计数器，零外部依赖
- **文章搜索** — 全文搜索 + 内容行预览 + 结果展开
- **字数统计** — 构建时预计算，零运行时开销
- **暗色模式** — 自动跟随系统 + 手动切换
- **RSS 订阅** — 自动生成 `/rss.xml`
- **站点地图** — 自动生成 `/sitemap.xml`
- **Cookie 管理** — GDPR 合规的 Cookie 偏好设置

## 开发

```bash
pnpm install
pnpm dev
```

## 构建与部署

```bash
# 构建（包含数据预计算 + 图片后处理）
pnpm build

# 部署到 Cloudflare Workers
pnpm deploy
```

## 文章写作

文章存放在 `src/content/posts/<slug>/index.md`，Frontmatter 格式：

```yaml
---
title: 文章标题
published: 2025-01-01T00:00:00
description: 文章简介
image: img/cover.png
tags: [标签1, 标签2]
category: '分类'
pinned: false
draft: false
---
```

- 文章内的图片放在 `src/content/posts/<slug>/img/` 目录下，构建时自动转换为 AVIF
- 置顶文章设置 `pinned: true`
- 草稿设置 `draft: true`，不会出现在文章列表

## 封面制作

访问 `/cover`，功能：

- 自定义左右文字、字体粗细、自定义字体
- 图标搜索（Iconify 图库）或上传本地图片
- 背景色、不透明度、背景图片（支持拖拽上传）
- 画板比例：1:1、4:3、16:9、21:9（可多选，导出时分别裁剪）
- 图标背景：圆角、模糊、不透明度
- 文字/图标阴影：颜色、偏移、模糊、透明度
- 导出格式：PNG（支持 1x/2x/3x/4x）或 SVG
- 移动端使用选项卡切换控制面板

## 友链系统

### 添加友链

将 JSON 文件放入 `src/routes/friends/` 目录，文件名作为唯一标识：

```json
{
  "name": "站点名",
  "avatar": "https://example.com/avatar.png",
  "description": "站点描述",
  "url": "https://example.com"
}
```

构建时自动扫描加载，无需改代码。

### GitHub Actions 自动审核

1. 在仓库 Issues 中选择「友链申请」模板提交
2. GitHub Actions 自动检测申请站点是否包含本站反链
3. 安全扫描后自动写入 JSON 文件并合并
4. 审核结果自动评论到 Issue

需要在 GitHub 仓库 Settings → Actions → General → Workflow permissions 勾选 **Read and write permissions**。

## 浏览量统计

### 本地开发

自动使用内存计数器，无需任何配置。

### 生产环境（Cloudflare KV）

```bash
# 创建 KV 命名空间
npx wrangler kv:namespace create PAGEVIEWS
```

将输出的 id 写入项目根目录 `wrangler.toml`：

```toml
[[kv_namespaces]]
binding = "PAGEVIEWS"
id = "你的KV-ID"
```

在页面中使用 `<PageViews>` 组件：

```svelte
<PageViews pathname="/posts/my-post/" />
```

参数：
- `pathname` — 页面路径（必填）
- `prefix` — 前缀文字（默认空）
- `suffix` — 后缀文字（默认"次浏览"）
- `class` — 自定义样式类

### 已集成页面

- 文章详情页：自动展示字数和浏览量

## 项目结构

```
src/
  content/posts/       # 博客文章（Markdown）
  lib/
    components/        # Svelte 组件
      cover/           # 封面生成器子组件
      ui/              # shadcn-svelte UI 组件
    config/            # 站点配置
    data/              # 构建时生成的静态数据
    utils/             # 工具函数
    stores/            # Svelte 状态存储
    types/             # TypeScript 类型定义
  routes/
    api/views/         # 浏览量 API 端点
    cover/             # 封面制作页
    friends/           # 友链页
    posts/             # 博客列表 + 详情页
    ptg/               # 隐藏图工具页
  app.css              # 全局样式
scripts/               # 构建脚本
vite-plugins/          # Vite 插件（KaTeX、GitHub Alerts、图片处理等）
```

## 站点配置

编辑 `src/lib/config/site.ts`：

```ts
export const siteConfig = {
  url: 'https://你的域名',
  title: '站点标题',
  description: '站点描述',
  bio: {
    name: '你的名字',
    avatar: '/avatar.svg',
    bio: '个人简介',
    links: [
      { name: 'GitHub', icon: 'simple-icons:github', url: '...' }
    ]
  },
  navLinks: [
    { label: '博客', icon: 'mdi:post-outline', href: '/posts' }
  ]
};
```

## 技术栈

- Svelte 5 (Runes) + SvelteKit
- Tailwind CSS v4 + shadcn-svelte + bits-ui
- MDsveX + KaTeX + rehype-pretty-code
- Cloudflare Workers + KV + adapter-cloudflare
- GitHub Actions CI
