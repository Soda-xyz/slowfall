// Declare a lightweight global type for `window.__env` which is populated at runtime by the container
// This avoids repeated `any` casts across the frontend codebase.

declare global {
	interface Window {
		__env?: Record<string, string | undefined>;
	}
}

export {};
