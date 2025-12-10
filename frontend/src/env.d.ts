interface ImportMetaEnv {
	readonly VITE_API_BASE_URL?: string;
	[key: string]: string | undefined;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

declare global {
	interface Window {
		__env?: ImportMetaEnv;
	}
}
