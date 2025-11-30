// Centralized fetch client for the frontend
// - Injects Authorization: Bearer <token> from tokenStore (localStorage) when present
// - Exports helpers to get/set/clear the auth token

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

let refreshPromise: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
	// Return existing in-flight refresh to avoid multiple concurrent refresh requests
	if (refreshPromise) return refreshPromise;

	refreshPromise = (async () => {
		try {
			const base = apiBase();
			const url = `${base}/web-auth/refresh`;
			const res = await fetch(url, { method: "POST", credentials: "include" });
			if (!res.ok) {
				// Refresh failed (401 or other). Clear token and indicate failure.
				clearAuthToken();
				return false;
			}
			const data = await res.json().catch(() => null);
			if (!data || typeof data.access_token !== "string") {
				// Invalid response
				clearAuthToken();
				return false;
			}
			setAuthToken(data.access_token);
			return true;
		} catch {
			// Network or other error during refresh
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
		} catch {
			// ignore
		}

		const merged: RequestInit = {
			...init,
			headers,
			credentials: init.credentials ?? "include",
		};

		return fetch(input, merged);
	}

	const res = await doFetch();
	if (res.status !== 401) return res;

	// Try to refresh once
	const refreshed = await doRefresh();
	if (!refreshed) {
		// refresh failed, return original 401 response
		return res;
	}

	// Retry original request once with new token
	return doFetch();
}

// Re-export subscribe so consumers can import all token helpers from fetchClient
export const subscribe = tokenStore.subscribe;
