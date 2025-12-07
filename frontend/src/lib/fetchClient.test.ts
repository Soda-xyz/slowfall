import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchWithAuth, setAuthToken } from "./fetchClient";
import * as apiBase from "./apiBase";

describe("fetchWithAuth", () => {
	let originalFetch: typeof globalThis.fetch | undefined;
	let originalApiBase: string | undefined;

	beforeEach(() => {
		originalFetch = globalThis.fetch;
		try {
			originalApiBase = (
				apiBase as unknown as { getApiBaseUrl?: () => string }
			).getApiBaseUrl?.() as string | undefined;
		} catch {
			originalApiBase = undefined;
		}
		vi.restoreAllMocks();
		localStorage.clear();
	});

	afterEach(() => {
		if (originalFetch) globalThis.fetch = originalFetch;
		try {
			(apiBase as unknown as { setApiBaseUrl?: (v?: string) => void }).setApiBaseUrl?.(
				originalApiBase,
			);
		} catch {
			void 0;
		}
		localStorage.clear();
	});

	it("adds Authorization header when auth token is present", async () => {
		setAuthToken("tok-123");
		const mockFetch = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
		globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

		await fetchWithAuth("/api/test");

		expect(mockFetch).toHaveBeenCalled();
		const call = mockFetch.mock.calls[0] as unknown as [RequestInfo, RequestInit | undefined];
		const calledInit = (call[1] ?? {}) as RequestInit;
		const headers = calledInit.headers as Headers | Record<string, string> | undefined;
		if (headers instanceof Headers) {
			expect(headers.get("Authorization")).toBe("Bearer tok-123");
		} else if (headers && typeof headers === "object") {
			expect((headers as Record<string, string>)["Authorization"]).toBeDefined();
		} else {
			throw new Error("Request headers missing from mock fetch call");
		}
		expect(calledInit.credentials).toBe("include");
	});

	it("normalizes api base when API_BASE_URL is empty to avoid /api/api duplication", async () => {
		(apiBase as unknown as { setApiBaseUrl?: (v?: string) => void }).setApiBaseUrl?.("");
		const mockFetch = vi.fn(() => Promise.resolve(new Response(null, { status: 200 })));
		globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

		await fetchWithAuth("/endpoint");

		const call = mockFetch.mock.calls[0] as unknown as [RequestInfo, RequestInit | undefined];
		const finalUrl = call[0] as string;
		expect(finalUrl.startsWith("/api/") || finalUrl === "/api/endpoint").toBe(true);
		expect(finalUrl.includes("/api/api")).toBe(false);
	});
});
