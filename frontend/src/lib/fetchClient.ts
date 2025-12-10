/**
 * Centralized fetch client for the frontend.
 *
 * Features:
 * - Attaches `Authorization: Bearer token` when an access token is available in `tokenStore`.
 * - Attempts MSAL silent token acquisition as a fallback when no token is stored.
 * - Implements a refresh flow that POSTs to `/web-auth/refresh` and updates tokens on success.
 * - Uses `credentials: 'include'` by default so cookies are preserved through the nginx proxy.
 */

import * as tokenStore from "./tokenStore";
import { getApiBaseUrl } from "./apiBase";
import { getStoredPseudoCredentials } from "../auth/BasicLogin";
import { logger } from "./log";

/**
 * Get stored access token from tokenStore (best-effort).
 */
export function getAuthToken(): string | null {
	try {
		return tokenStore.getToken();
	} catch (err) {
		logger.debug("getAuthToken: failed to read token from tokenStore:", err);
		return null;
	}
}

/**
 * Store an access token in tokenStore (best-effort).
 */
export function setAuthToken(token: string): void {
	try {
		tokenStore.setToken(token);
	} catch (err) {
		logger.debug("setAuthToken: failed to set token in tokenStore:", err);
	}
}

/**
 * Clear auth tokens from tokenStore (best-effort).
 */
export function clearAuthToken(): void {
	try {
		tokenStore.clearToken();
		try {
			tokenStore.clearRefreshToken();
		} catch (err) {
			logger.debug("clearAuthToken: failed to clear refresh token:", err);
		}
	} catch (err) {
		logger.debug("clearAuthToken: failed to clear token:", err);
	}
}

/**
 * Compute a normalized API prefix using Vite-provided API_BASE_URL.
 *
 * Behavior:
 * - If VITE_API_BASE_URL is defined at build time and is an empty string, treat it as root and use relative paths, e.g. '/api'.
 * - If VITE_API_BASE_URL is a full origin (e.g. 'https://api.example.com'), append '/api', e.g. 'https://api.example.com/api'.
 * - If VITE_API_BASE_URL already ends with '/api', return it as-is to avoid '/api/api'.
 */
function apiPrefix(): string {
	const raw = (getApiBaseUrl() ?? "") as string;
	const trimmed = raw.replace(/\/+$/, "");
	if (trimmed === "") return "/api";
	if (trimmed.endsWith("/api")) return trimmed;
	return `${trimmed}/api`;
}

/**
 * Normalize an input RequestInfo into a final URL for API calls.
 *
 * Rules:
 * - Absolute URLs (http(s)://...) are returned unchanged.
 * - Paths that already start with '/api' are returned unchanged.
 * - Paths starting with '/' (but not '/api') are prefixed with `apiPrefix()` (so '/protected' becomes '/api/protected').
 * - Other strings are prefixed with '/api/' followed by the input.
 */
function normalizeApiUrl(input: RequestInfo): string | Request {
	if (typeof input !== "string") return input;
	const url = input;
	if (/^https?:\/\//i.test(url)) return url;
	if (url.startsWith("/api")) return url;
	const prefix = apiPrefix();
	if (url.startsWith("/")) return `${prefix}${url}`;
	return `${prefix}/${url}`;
}

let refreshPromise: Promise<boolean> | null = null;

/**
 * Try to refresh access tokens by calling the refresh endpoint and update store on success.
 */
async function doRefresh(): Promise<boolean> {
	if (refreshPromise) return refreshPromise;

	refreshPromise = (async () => {
		try {
			const refreshToken = tokenStore.getRefreshToken();

			const prefix = apiPrefix();
			const url = `${prefix}/web-auth/refresh`;
			const headers: Record<string, string> = {};
			const init: RequestInit = {
				method: "POST",
				credentials: "include",
			};

			if (refreshToken) {
				headers["Content-Type"] = "application/json";
				init.body = JSON.stringify({ refresh_token: refreshToken });
			}

			if (Object.keys(headers).length > 0) {
				init.headers = headers;
			}

			const res = await fetch(url, init);
			if (!res.ok) {
				clearAuthToken();
				return false;
			}
			const data = await res.json().catch(() => null);
			if (!data || typeof data.access_token !== "string") {
				clearAuthToken();
				return false;
			}
			setAuthToken(data.access_token);
			if (data.refresh_token && typeof data.refresh_token === "string") {
				try {
					tokenStore.setRefreshToken(data.refresh_token);
				} catch (err) {
					logger.debug("doRefresh: failed to set refresh token from response:", err);
				}
			}
			return true;
		} catch (refreshError) {
			logger.debug("Token refresh failed:", refreshError);
			clearAuthToken();
			return false;
		} finally {
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

/**
 * Perform a fetch with Authorization handling, refresh-on-401, and default credentials.
 */
export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
	/**
	 * Internal helper that performs the actual fetch call with the prepared headers.
	 * Returns the raw `Response` from `fetch` and does not perform 401 handling.
	 */
	async function doFetch(): Promise<Response> {
		const headers = new Headers(init.headers as HeadersInit | undefined);

		try {
			let token = getAuthToken();
			if (!token) {
				try {
					const creds = getStoredPseudoCredentials();
					if (creds.user && creds.pass) {
						const basic = btoa(`${creds.user}:${creds.pass}`);
						headers.set("Authorization", `Basic ${basic}`);
					}
				} catch (err) {
					logger.debug("fetchWithAuth: failed to read stored pseudo credentials:", err);
				}
			}
			if (token) headers.set("Authorization", `Bearer ${token}`);
		} catch (tokenErr) {
			console.debug("Failed to read auth token from tokenStore", tokenErr);
		}

		const merged: RequestInit = {
			...init,
			headers,
			credentials: (init.credentials as RequestCredentials) ?? "include",
		};

		const finalUrl = normalizeApiUrl(input);
		return fetch(finalUrl, merged);
	}

	let res = await doFetch();
	if (res.status !== 401) return res;

	try {
		const refreshed = await doRefresh();
		if (!refreshed) {
			return res;
		}
		res = await doFetch();
		return res;
	} catch (fetchError) {
		logger.debug("fetchWithAuth unexpected error:", fetchError);
		try {
			clearAuthToken();
		} catch (clearErr) {
			logger.debug("fetchWithAuth: failed to clear auth token after unexpected error:", clearErr);
		}
		return res;
	}
}

export const subscribe = tokenStore.subscribe;
