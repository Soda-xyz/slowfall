// Centralized fetch client for the frontend
// - Injects Authorization: Bearer <token> from sessionStorage.auth_access_token when present
// - Exports helpers to get/set/clear the auth token

export function getAuthToken(): string | null {
	try {
		if (typeof window === "undefined") return null;
		return sessionStorage.getItem("auth_access_token");
	} catch {
		return null;
	}
}

export function setAuthToken(token: string): void {
	try {
		if (typeof window === "undefined") return;
		sessionStorage.setItem("auth_access_token", token);
	} catch {
		// ignore
	}
}

export function clearAuthToken(): void {
	try {
		if (typeof window === "undefined") return;
		sessionStorage.removeItem("auth_access_token");
	} catch {
		// ignore
	}
}

export async function fetchWithAuth(input: RequestInfo, init: RequestInit = {}): Promise<Response> {
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
