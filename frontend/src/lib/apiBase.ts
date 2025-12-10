/**
 * API base helpers.
 *
 * Exports:
 * - getApiBaseUrl(): computes the effective API base using Vite build-time env variables or runtime heuristics.
 * - setApiBaseUrl(value?): override the computed value (useful for tests).
 * - resetApiBaseUrl(): clear any override.
 * - API_BASE_URL (legacy): a live binding kept in sync for compatibility with existing imports.
 */

let _overrideApiBase: string | undefined;

/**
 * Override the computed API base URL (used for tests or runtime overrides).
 */
export function setApiBaseUrl(value?: string): void {
	_overrideApiBase = value;
	API_BASE_URL = getApiBaseUrl();
}

/**
 * Reset any manual API base override and recompute default.
 */
export function resetApiBaseUrl(): void {
	_overrideApiBase = undefined;
	API_BASE_URL = getApiBaseUrl();
}

/**
 * Compute the effective API base URL using override, Vite env, mode, or host heuristics.
 */
export function getApiBaseUrl(): string {
	if (typeof _overrideApiBase !== "undefined") return _overrideApiBase;

	if (typeof import.meta.env?.VITE_API_BASE_URL !== "undefined") {
		return (import.meta.env?.VITE_API_BASE_URL as string) || "";
	}

	const mode =
		(import.meta.env?.VITE_FRONTEND_ENV as string | undefined) ||
		(import.meta.env?.MODE as string | undefined);
	if (mode === "development") return "http://localhost:8080";

	if (typeof window !== "undefined") {
		const host = window.location?.hostname || "";
		if (host === "localhost" || host === "127.0.0.1") return "http://localhost:8080";
	}

	return "/api";
}

export let API_BASE_URL: string = getApiBaseUrl();
