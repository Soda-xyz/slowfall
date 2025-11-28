import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithAuth, setAuthToken } from "./fetchClient";

describe("fetchWithAuth", () => {
	let originalFetch: typeof globalThis.fetch | undefined;

	beforeEach(() => {
		originalFetch = globalThis.fetch;
		vi.restoreAllMocks();
		// clear storage
		sessionStorage.clear();
	});

	afterEach(() => {
		if (originalFetch) globalThis.fetch = originalFetch;
		sessionStorage.clear();
	});

	it("adds Authorization header when auth token is present", async () => {
		setAuthToken("tok-123");
		// mock fetch to return a simple Response-like object
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
});
