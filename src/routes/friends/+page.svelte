<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import * as Pagination from '$lib/components/ui/pagination';
	import Icon from '@iconify/svelte';
	import { siteConfig } from '$lib/config/site';

	interface Friend {
		name: string;
		avatar: string | null;
		description?: string;
		url: string;
	}

	let friends = $state<Friend[]>([]);
	let currentPage = $state(1);
	const itemsPerPage = 12;
	let totalPages = $derived(Math.ceil(friends.length / itemsPerPage));
	let paginatedFriends = $derived(friends.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
</script>

<svelte:head>
	<title>友链 - {siteConfig.title}</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-12">
	<div class="mb-8 text-center">
		<h1 class="mb-4 text-4xl font-bold">友情链接</h1>
		<p class="text-lg text-muted-foreground">这里是我的朋友们，欢迎互相访问交流</p>
	</div>

	<div class="mb-8">
		<Card>
			<CardHeader>
				<CardTitle>申请友链</CardTitle>
				<CardDescription>欢迎与我交换友链</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-4">
					<div class="space-y-2 text-sm">
						<p class="font-semibold">本站信息：</p>
						<div class="space-y-1 text-muted-foreground">
							<p>· 网站名称：{siteConfig.bio.name}</p>
							<p>· 网站地址：{siteConfig.url}</p>
							<p>· 网站描述：{siteConfig.bio.bio}</p>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	</div>

	<div>
		<h2 class="mb-6 text-2xl font-bold">友链列表 ({friends.length})</h2>
		{#if friends.length === 0}
			<Card><CardContent class="py-12 text-center text-muted-foreground">暂无友链</CardContent></Card>
		{:else}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each paginatedFriends as friend (friend.url)}
					<a href={friend.url} target="_blank" rel="noopener noreferrer">
						<Card class="h-full transition-all hover:shadow-lg">
							<CardContent class="flex items-start gap-4 p-6">
								{#if friend.avatar}
									<img src={friend.avatar} alt={friend.name} class="h-16 w-16 rounded-full" />
								{:else}
									<div class="flex h-16 w-16 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground">{friend.name.charAt(0)}</div>
								{/if}
								<div class="flex-1 overflow-hidden">
									<div class="mb-1 truncate font-semibold">{friend.name}</div>
									<div class="line-clamp-2 text-sm text-muted-foreground">{friend.description || '暂无描述'}</div>
								</div>
							</CardContent>
						</Card>
					</a>
				{/each}
			</div>
			{#if totalPages > 1}
				<div class="mt-8 flex justify-center">
					<Pagination.Root count={friends.length} perPage={itemsPerPage} bind:page={currentPage}>
						{#snippet children({ pages })}
							<Pagination.Content>
								<Pagination.Item><Pagination.PrevButton /></Pagination.Item>
								{#each pages as page (page.key)}
									{#if page.type === 'ellipsis'}
										<Pagination.Item><Pagination.Ellipsis /></Pagination.Item>
									{:else}
										<Pagination.Item><Pagination.Link {page} isActive={currentPage === page.value}>{page.value}</Pagination.Link></Pagination.Item>
									{/if}
								{/each}
								<Pagination.Item><Pagination.NextButton /></Pagination.Item>
							</Pagination.Content>
						{/snippet}
					</Pagination.Root>
				</div>
			{/if}
		{/if}
	</div>
</div>
