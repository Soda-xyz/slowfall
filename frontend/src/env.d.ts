interface ImportMetaEnv {
	readonly VITE_API_BASE_URL?: string;
	readonly VITE_MSAL_CLIENT_ID?: string;
	readonly VITE_MSAL_AUTHORITY?: string;
	readonly VITE_MSAL_REDIRECT_URI?: string;
	[key: string]: string | undefined;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// Declare a typed global `window.__env` (runtime-provided) so callers don't need to cast to `any`.
declare global {
	interface Window {
		__env?: ImportMetaEnv;
	}
}
