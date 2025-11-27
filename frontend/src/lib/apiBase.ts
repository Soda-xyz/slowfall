// frontend/src/lib/apiBase.ts
// Provides a single source-of-truth for the API base URL used by the frontend.
// The value is determined in this order:
// 1. Vite build-time env var VITE_API_BASE_URL (embedded at build)
// 2. If running on localhost in the browser, fallback to http://localhost:8080 (developer convenience)
// 3. Otherwise use relative '/api' so static assets can be same-origin and proxied by nginx

export const API_BASE_URL: string = (import.meta.env?.VITE_API_BASE_URL as string) ?? (
  typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8080"
    : "/api"
);

