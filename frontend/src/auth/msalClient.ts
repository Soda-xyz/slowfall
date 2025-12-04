import {
	PublicClientApplication,
	type Configuration,
	type SilentRequest,
} from "@azure/msal-browser";

/**
 * Runtime config: first prefer window.__env (written by the container entrypoint) so
 * we can change values without rebuilding. Fall back to import.meta.env when the
 * project was built with Vite-provided environment variables.
 */
const runtimeEnv = (typeof window !== "undefined" && window.__env) || undefined;

const importMeta = import.meta as unknown as { env: Record<string, string | undefined> };
const buildEnv = importMeta.env;

const env = Object.assign({}, buildEnv, runtimeEnv || {});

let msalInstance: PublicClientApplication | null = null;

function createMsalInstanceIfPossible(): PublicClientApplication | null {
	if (msalInstance) return msalInstance;
	const clientId = (env.VITE_MSAL_CLIENT_ID || "").trim();
	const tenantId = (env.VITE_MSAL_TENANT_ID || "").trim();
	const authorityFromEnv = (env.VITE_MSAL_AUTHORITY || "").trim();
	const authority =
		authorityFromEnv || (tenantId ? `https://login.microsoftonline.com/${tenantId}` : "");
	// Require both a clientId and an authority string. MSAL internals assume authority is a string
	// and may call .endsWith() on it — creating an instance without a valid authority can throw.
	if (!clientId || !authority) {
		// Not configured yet
		return null;
	}
	const msalConfig: Configuration = {
		auth: {
			clientId,
			authority,
			redirectUri:
				env.VITE_MSAL_REDIRECT_URI || (typeof window !== "undefined" ? window.location.origin : ""),
		},
		cache: {
			cacheLocation: "sessionStorage",
			storeAuthStateInCookie: false,
		},
	};
	try {
		msalInstance = new PublicClientApplication(msalConfig);
		return msalInstance;
	} catch (e) {
		console.debug("Failed to initialize MSAL", e);
		msalInstance = null;
		return null;
	}
}

export async function acquireTokenSilentIfPossible(
	scopes: string[] | string,
): Promise<string | null> {
	try {
		const instance = createMsalInstanceIfPossible();
		if (!instance) return null;
		const scopeArray = Array.isArray(scopes) ? scopes : [scopes];
		const accounts = instance.getAllAccounts();
		if (!accounts || accounts.length === 0) return null;
		const request: SilentRequest = { account: accounts[0], scopes: scopeArray };
		try {
			const resp = await instance.acquireTokenSilent(request as SilentRequest);
			return resp?.accessToken ?? null;
		} catch {
			return null;
		}
	} catch (e) {
		console.debug("acquireTokenSilentIfPossible unexpected error", e);
		return null;
	}
}

// Export a helper to know whether MSAL is available (useful for UI/debug)
export function isMsalConfigured(): boolean {
	const clientId = (env.VITE_MSAL_CLIENT_ID || "").trim();
	const tenantId = (env.VITE_MSAL_TENANT_ID || "").trim();
	const authorityFromEnv = (env.VITE_MSAL_AUTHORITY || "").trim();
	const authority =
		authorityFromEnv || (tenantId ? `https://login.microsoftonline.com/${tenantId}` : "");
	return Boolean(clientId && authority);
}
