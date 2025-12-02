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
