declare global {
	namespace App {
		interface Platform {
			env?: {
				PAGEVIEWS?: KVNamespace;
			};
		}
	}
}

export {};
