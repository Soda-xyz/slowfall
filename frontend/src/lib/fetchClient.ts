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
import { acquireTokenSilentIfPossible } from "../auth/msalClient";

const runtimeEnv = (typeof window !== "undefined" && (window as any).__env) || undefined;
const buildEnv = import.meta.env as unknown as Record<string, string | undefined>;
const env = Object.assign({}, buildEnv, runtimeEnv || {});

let tryAcquireMsalToken: ((scopes?: string[]) => Promise<string | null>) | null = async (
	scopes?: string[],
) => {
	return acquireTokenSilentIfPossible(scopes ?? []);
};

export function getAuthToken(): string | null {
	try {
		return tokenStore.getToken();
	} catch {
		return null;
	}
}

export function setAuthToken(token: string): void {
	try {
		tokenStore.setToken(token);
	} catch {
		// swallow storage errors
	}
}

export function clearAuthToken(): void {
	try {
		tokenStore.clearToken();
		// also clear refresh token when clearing auth state
		try {
			tokenStore.clearRefreshToken();
		} catch {
			// swallow
		}
	} catch {
		// swallow
	}
}

/**
 * Compute a normalized API prefix using Vite-provided API_BASE_URL.
 *
 * Behavior:
 * - If VITE_API_BASE_URL is defined at build time and is an empty string, treat it as root and use relative paths -> '/api'.
 * - If VITE_API_BASE_URL is a full origin (e.g. 'https://api.example.com'), append '/api' -> 'https://api.example.com/api'.
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
 * - Paths starting with '/' (but not '/api') are prefixed with `apiPrefix()` (so '/protected' -> '/api/protected').
 * - Other strings are prefixed as '/api/{input}'.
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

// Refresh control: avoid multiple concurrent refresh requests
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
	// Return existing in-flight refresh to avoid multiple concurrent refresh requests
	if (refreshPromise) return refreshPromise;

	refreshPromise = (async () => {
		try {
			// Attempt to read a stored refresh token if present. When no refresh token is stored
			// some backends may still use server-side state (cookies) to refresh sessions; therefore
			// we don't bail out early. Tests also assume the refresh endpoint may be called.
			const refreshToken = tokenStore.getRefreshToken();

			const prefix = apiPrefix();
			const url = `${prefix}/web-auth/refresh`;
			// Build headers only when we will send a JSON body. Sending 'Content-Type: application/json'
			// without a body can trigger a CORS preflight OPTIONS request; some proxies may not handle OPTIONS.
			const headers: Record<string, string> = {};
			const init: RequestInit = {
				method: "POST",
				// The backend issues an HttpOnly refresh cookie; include credentials so the browser will send that cookie on refresh requests.
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
				// Refresh failed (401 or other). Clear tokens and indicate failure.
				clearAuthToken();
				return false;
			}
			const data = await res.json().catch(() => null);
			if (!data || typeof data.access_token !== "string") {
				// Invalid response
				clearAuthToken();
				return false;
			}
			// Store new access token
			setAuthToken(data.access_token);
			// Optionally update refresh token if backend returned one
			if (data.refresh_token && typeof data.refresh_token === "string") {
				try {
					tokenStore.setRefreshToken(data.refresh_token);
				} catch {
					// ignore
				}
			}
			return true;
		} catch (refreshError) {
			// Network or other error during refresh - clear auth state.
			console.debug("Token refresh failed", refreshError);
			clearAuthToken();
			return false;
		} finally {
			// reset the in-flight marker so future refreshes can occur
			refreshPromise = null;
		}
	})();

	return refreshPromise;
}

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
	// Helper to actually perform fetch with Authorization header
	async function doFetch(): Promise<Response> {
		const headers = new Headers(init.headers as HeadersInit | undefined);

		// Attach Authorization header if auth token available
		try {
			let token = getAuthToken();
			// If no token in tokenStore, attempt to acquire silently from MSAL (optional)
			if (!token && tryAcquireMsalToken) {
				try {
					const msalScopes: string[] = [
						`api://${env.VITE_MSAL_BACKEND_CLIENT_ID || env.VITE_MSAL_CLIENT_ID}/access_as_user`,
					];
					const acquired = await tryAcquireMsalToken(msalScopes);
					if (acquired) {
						token = acquired;
						// Mirror into tokenStore for other consumers
						try {
							tokenStore.setToken(acquired);
						} catch {
							// swallow storage errors
						}
					}
				} catch {
					// swallow msal errors and continue without token
				}
			}
			if (token) headers.set("Authorization", `Bearer ${token}`);
		} catch (tokenErr) {
			// Log for debugging but do not expose token values
			console.debug("Failed to read auth token from tokenStore", tokenErr);
		}

		const merged: RequestInit = {
			...init,
			headers,
			// Default to include credentials so cookies and Authorization headers are preserved behind the proxy.
			// Callers can override by passing an explicit `credentials` in `init` if they need a different behaviour.
			credentials: (init.credentials as RequestCredentials) ?? "include",
		};

		const finalUrl = normalizeApiUrl(input);
		return fetch(finalUrl, merged);
	}

	// First attempt
	let res = await doFetch();
	if (res.status !== 401) return res;

	// 401: try refresh once
	try {
		const refreshed = await doRefresh();
		if (!refreshed) {
			// refresh failed -> return original 401 so UI can handle redirect/login
			return res;
		}
		// Retry original request once with new token
		res = await doFetch();
		return res;
	} catch (fetchError) {
		// On unexpected error, clear auth and return the first response
		console.debug("fetchWithAuth unexpected error", fetchError);
		try {
			clearAuthToken();
		} catch (clearErr) {
			console.debug("Failed to clear auth token", clearErr);
		}
		return res;
	}
}

// Re-export subscribe so consumers can import all token helpers from fetchClient
export const subscribe = tokenStore.subscribe;
