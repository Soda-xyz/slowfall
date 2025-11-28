export const API_BASE_URL: string = (() => {
	// If VITE_API_BASE_URL is defined at build time (even an empty string), use it.
	// This allows production to set `VITE_API_BASE_URL=` to mean root (so `${API_BASE_URL}/api/...` -> `/api/...`).
	if (typeof import.meta.env?.VITE_API_BASE_URL !== "undefined") {
		return (import.meta.env?.VITE_API_BASE_URL as string) || "";
	}

	// Determine mode: prefer explicit VITE_FRONTEND_ENV (exposed via .env files), fall back to Vite's MODE
	const mode =
		(import.meta.env?.VITE_FRONTEND_ENV as string | undefined) ||
		(import.meta.env?.MODE as string | undefined);
	if (mode === "development") return "http://localhost:8080";

	// Last-resort: runtime hostname detection for dev mode when running locally without env vars
	if (typeof window !== "undefined") {
		const host = window.location?.hostname || "";
		if (host === "localhost" || host === "127.0.0.1") return "http://localhost:8080";
	}

	// Production default: expect backend proxied at /api
	return "/api";
})();
