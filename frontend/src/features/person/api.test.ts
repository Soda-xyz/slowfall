import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchPilots } from "./api";
import type { Person } from "./types";

describe("person api", () => {
	const originalFetch = globalThis.fetch;
	let mockFetch: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockFetch = vi.fn();
		globalThis.fetch = mockFetch as unknown as typeof fetch;
	});

	afterEach(() => {
		vi.resetAllMocks();
		globalThis.fetch = originalFetch;
	});

	it("fetchPilots should return content array from paged response", async () => {
		const pilots: Person[] = [
			{
				id: 1,
				name: "Pilot One",
				weight: 80,
				email: "p1@example.com",
				pilot: true,
				skydiver: false,
			},
		];

		mockFetch.mockImplementationOnce(() =>
			Promise.resolve({
				ok: true,
				json: () => Promise.resolve({ content: pilots }),
			} as unknown as Response),
		);

		const res = await fetchPilots();
		expect(res).toHaveLength(1);
		expect(res[0].name).toBe("Pilot One");
	});

	it("fetchPilots falls back to /api/person if search returns 404 and filters pilots", async () => {
		const all: Person[] = [
			{
				id: 1,
				name: "Pilot One",
				weight: 80,
				email: "p1@example.com",
				pilot: true,
				skydiver: false,
			},
			{
				id: 2,
				name: "Not Pilot",
				weight: 70,
				email: "np@example.com",
				pilot: false,
				skydiver: false,
			},
		];

		mockFetch.mockImplementationOnce(() =>
			Promise.resolve({ ok: false, status: 404, statusText: "Not Found" } as unknown as Response),
		);

		mockFetch.mockImplementationOnce(() =>
			Promise.resolve({ ok: true, json: () => Promise.resolve(all) } as unknown as Response),
		);

		const res = await fetchPilots();
		expect(res).toHaveLength(1);
		expect(res[0].name).toBe("Pilot One");
	});
});
