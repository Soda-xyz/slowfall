import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { getToken, setToken, clearToken, subscribe } from "./tokenStore";

describe("tokenStore", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.restoreAllMocks();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("get/set/clear should work", () => {
		expect(getToken()).toBeNull();
		setToken("abc");
		expect(getToken()).toBe("abc");
		clearToken();
		expect(getToken()).toBeNull();
	});

	it("subscribe should receive updates", () => {
		const calls: Array<string | null> = [];
		const unsub = subscribe((tokenValue) => calls.push(tokenValue));
		// initial call
		expect(calls.length).toBeGreaterThanOrEqual(1);
		setToken("x");
		setToken("y");
		clearToken();
		unsub();
		// ensure at least the changes were observed
		expect(calls.some((call) => call === "x")).toBe(true);
		expect(calls.some((call) => call === "y")).toBe(true);
	});
});
