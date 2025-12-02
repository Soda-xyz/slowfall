import {
	PublicClientApplication,
	type Configuration,
	type SilentRequest,
} from "@azure/msal-browser";

/**
 * `import.meta.env` is provided by Vite at build-time. Cast `import.meta` to a shape that
 * includes `env` so TypeScript understands the property in our strict config.
 */
const importMeta = import.meta as unknown as { env: Record<string, string | undefined> };
const env = importMeta.env;

const msalConfig: Configuration = {
	auth: {
		clientId: env.VITE_MSAL_CLIENT_ID || "",
		authority:
			env.VITE_MSAL_AUTHORITY ||
			(env.VITE_MSAL_TENANT_ID
				? `https://login.microsoftonline.com/${env.VITE_MSAL_TENANT_ID}`
				: undefined),
		redirectUri:
			env.VITE_MSAL_REDIRECT_URI || (typeof window !== "undefined" ? window.location.origin : ""),
	},
	cache: {
		cacheLocation: "sessionStorage",
		storeAuthStateInCookie: false,
	},
};

export const msalInstance = new PublicClientApplication(msalConfig);

export async function acquireTokenSilentIfPossible(
	scopes: string[] | string,
): Promise<string | null> {
	const scopeArray = Array.isArray(scopes) ? scopes : [scopes];
	const accounts = msalInstance.getAllAccounts();
	if (!accounts || accounts.length === 0) return null;
	const request: SilentRequest = { account: accounts[0], scopes: scopeArray };
	try {
		const resp = await msalInstance.acquireTokenSilent(request as SilentRequest);
		return resp?.accessToken ?? null;
	} catch {
		return null;
	}
}
