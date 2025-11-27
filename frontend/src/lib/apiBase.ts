export const API_BASE_URL: string =
	(import.meta.env?.VITE_API_BASE_URL as string) ??
	((typeof window !== "undefined" && window.location.hostname === "localhost") ||
	window.location.hostname === "127.0.0.1"
		? "http://localhost:8080"
		: "/api");
