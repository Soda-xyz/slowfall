import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithAuth, setAuthToken, getAuthToken } from "./fetchClient";

describe("fetchWithAuth refresh flow", () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("refreshes token on 401 and retries original request", async () => {
		let refreshed = false;
		const mockFetch = vi.fn((input: RequestInfo) => {
			const url = typeof input === "string" ? input : (input as Request).url;
			if (url.endsWith("/web-auth/refresh")) {
				refreshed = true;
				return Promise.resolve(
					new Response(JSON.stringify({ access_token: "new-token" }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					}),
				);
			}

			if (url.includes("/api/")) {
				if (!refreshed) return Promise.resolve(new Response(null, { status: 401 }));
				return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
			}

			return Promise.resolve(new Response(null, { status: 404 }));
		});

		globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

		setAuthToken("old-token");

		const res = await fetchWithAuth("/api/protected");
		expect(res.status).toBe(200);

		expect(getAuthToken()).toBe("new-token");

		expect(
			mockFetch.mock.calls.some((callArgs) =>
				(callArgs[0] as string).endsWith("/web-auth/refresh"),
			),
		).toBe(true);
	});

	it("performs a single refresh when multiple requests receive 401 concurrently", async () => {
		let refreshed = false;
		const mockFetch = vi.fn((input: RequestInfo) => {
			const url = typeof input === "string" ? input : (input as Request).url;
			if (url.endsWith("/web-auth/refresh")) {
				refreshed = true;
				return Promise.resolve(
					new Response(JSON.stringify({ access_token: "concurrent-new" }), {
						status: 200,
						headers: { "Content-Type": "application/json" },
					}),
				);
			}
			if (url.includes("/api/")) {
				if (!refreshed) return Promise.resolve(new Response(null, { status: 401 }));
				return Promise.resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
			}
			return Promise.resolve(new Response(null, { status: 404 }));
		});

		globalThis.fetch = mockFetch as unknown as typeof globalThis.fetch;

		setAuthToken("old-token-2");

		const p1 = fetchWithAuth("/api/protected");
		const p2 = fetchWithAuth("/api/protected");

		const [r1, r2] = await Promise.all([p1, p2]);
		expect(r1.status).toBe(200);
		expect(r2.status).toBe(200);

		const refreshCalls = mockFetch.mock.calls.filter((callArgs) =>
			(callArgs[0] as string).endsWith("/web-auth/refresh"),
		).length;
		expect(refreshCalls).toBe(1);
	});
});
