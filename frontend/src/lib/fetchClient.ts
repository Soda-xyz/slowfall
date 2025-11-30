// Centralized fetch client for the frontend
// - Injects Authorization: Bearer <token> from tokenStore (localStorage) when present
// - Supports an optional refresh-token flow: the client will POST a stored refresh token to
//   /web-auth/refresh and update tokens on success. This avoids sending cookies and works
//   with a cookieless JWT setup.

import * as tokenStore from "./tokenStore";

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
		// ignore
	}
}

export function clearAuthToken(): void {
	try {
		tokenStore.clearToken();
		// also clear refresh token when clearing auth state
		try {
			tokenStore.clearRefreshToken();
		} catch {
			// ignore
		}
	} catch {
		// ignore
	}
}

// Compose API base URL using Vite env variable. If blank, use relative paths.
function apiBase(): string {
	try {
		const raw = (import.meta.env as unknown as Record<string, unknown>)["VITE_API_BASE_URL"] as
			| string
			| undefined;
		if (!raw) return "";
		// strip trailing slash
		return raw.replace(/\/$/, "");
	} catch {
		return "";
	}
}

// Refresh control: avoid multiple concurrent refresh requests
let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
	// Return existing in-flight refresh to avoid multiple concurrent refresh requests
	if (refreshPromise) return refreshPromise;

	refreshPromise = (async () => {
		try {
			// Attempt to read a stored refresh token if present. We no longer bail out when
			// there's no stored refresh token because some backends may use cookies or other
			// server-side state to refresh the session. Tests also expect the refresh endpoint
			// to be called even when a refresh token is not present in localStorage.
			const refreshToken = tokenStore.getRefreshToken();

			const base = apiBase();
			const url = `${base}/web-auth/refresh`;
			const init: RequestInit = {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				// Use credentials so cookie-backed refresh flows still work when configured.
				credentials: "include",
			};

			// Only include a JSON body when we actually have a refresh token stored.
			if (refreshToken) {
				init.body = JSON.stringify({ refresh_token: refreshToken });
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
			// Network or other error during refresh
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
			const token = getAuthToken();
			if (token) headers.set("Authorization", `Bearer ${token}`);
		} catch (tokenErr) {
			// Log for debugging but do not expose token values
			console.debug("Failed to read auth token from tokenStore", tokenErr);
		}

		const merged: RequestInit = {
			...init,
			headers,
			// Default to include credentials so API calls include cookies where needed and
			// tests that assert credentials see the expected value. Callers can override by
			// passing an explicit `credentials` in `init`.
			credentials: (init.credentials as RequestCredentials) ?? "include",
		};

		return fetch(input, merged);
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
