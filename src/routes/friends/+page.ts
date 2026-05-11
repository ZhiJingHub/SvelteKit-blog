import type { PageLoad } from './$types';

interface Friend {
	name: string;
	avatar: string | null;
	description?: string;
	url: string;
}

const friendModules = import.meta.glob<{ default: Friend }>('./*.json', { eager: true });

const friends: Friend[] = Object.values(friendModules).map((mod) => mod.default);

export const load: PageLoad = () => {
	return { friends };
};
