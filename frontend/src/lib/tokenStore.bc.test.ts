import { describe, it, beforeEach, afterEach, expect, vi } from "vitest";
import { setToken, clearToken, subscribe, CHANNEL } from "./tokenStore";

// Mock BroadcastChannel implementation for tests. Multiple instances with the same name
// will deliver messages to each other's listeners via a shared registry.
class MockBroadcastChannel {
	static registry: Map<string, MockBroadcastChannel[]> = new Map();
	name: string;
	listeners: Map<string, (ev: { data: unknown }) => void> = new Map();
	onmessage?: (ev: { data: unknown }) => void;
	constructor(name: string) {
		this.name = name;
		if (!MockBroadcastChannel.registry.has(name)) MockBroadcastChannel.registry.set(name, []);
		MockBroadcastChannel.registry.get(name)!.push(this);
	}
	addEventListener(type: string, cb: (ev: { data: unknown }) => void) {
		this.listeners.set(type, cb);
	}
	removeEventListener(type: string, cb: (ev: { data: unknown }) => void) {
		const existing = this.listeners.get(type);
		if (existing === cb) this.listeners.delete(type);
	}
	postMessage(msg: unknown) {
		const channel = MockBroadcastChannel.registry.get(this.name) || [];
		for (const inst of channel) {
			// deliver to onmessage handler if present (BroadcastChannel supports onmessage property)
			if (typeof inst.onmessage === "function") {
				try {
					inst.onmessage({ data: msg });
				} catch {
					// ignore listener errors for tests
				}
			}
			// also deliver to listeners registered via addEventListener('message', cb)
			const cb = inst.listeners.get("message");
			if (cb) {
				try {
					cb({ data: msg });
				} catch {
					// ignore
				}
			}
		}
	}
	close() {
		const arr = MockBroadcastChannel.registry.get(this.name) || [];
		const idx = arr.indexOf(this);
		if (idx >= 0) arr.splice(idx, 1);
	}
}

describe("tokenStore broadcast integration", () => {
	let originalBC: unknown;

	beforeEach(() => {
		// stash existing global BroadcastChannel (if any)
		originalBC = (globalThis as unknown as Record<string, unknown>)["BroadcastChannel"];
		// install mock without using `any` to satisfy lint rules
		(globalThis as unknown as Record<string, unknown>)["BroadcastChannel"] =
			MockBroadcastChannel as unknown;
		MockBroadcastChannel.registry.clear();
		localStorage.clear();
		vi.restoreAllMocks();
	});

	afterEach(() => {
		// restore previous BroadcastChannel
		(globalThis as unknown as Record<string, unknown>)["BroadcastChannel"] = originalBC as unknown;
		MockBroadcastChannel.registry.clear();
		localStorage.clear();
	});

	it("subscribe receives broadcasts from another BroadcastChannel instance", () => {
		const calls: Array<string | null> = [];
		const unsub = subscribe((tokenValue) => calls.push(tokenValue));

		// simulate another tab posting token by constructing a new mock BroadcastChannel
		const other = new MockBroadcastChannel(CHANNEL);
		other.postMessage({ type: "token", token: "abc" });
		other.postMessage({ type: "token", token: "def" });

		// also simulate token cleared message
		other.postMessage({ type: "token_cleared" });

		unsub();

		expect(calls).toContain("abc");
		expect(calls).toContain("def");
		expect(calls).toContain(null);
	});

	it("setToken and clearToken broadcast to other tabs", () => {
		const callsA: Array<string | null> = [];
		const callsB: Array<string | null> = [];

		const unsubA = subscribe((tokenValue) => callsA.push(tokenValue));
		const unsubB = subscribe((tokenValue) => callsB.push(tokenValue));

		// set token will write localStorage and broadcast
		setToken("x");
		setToken("y");
		clearToken();

		unsubA();
		unsubB();

		expect(callsA).toContain("x");
		expect(callsA).toContain("y");
		expect(callsA).toContain(null);

		expect(callsB).toContain("x");
		expect(callsB).toContain("y");
		expect(callsB).toContain(null);
	});
});
