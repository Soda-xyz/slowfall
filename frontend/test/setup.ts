Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: () => {},
		removeListener: () => {},
		addEventListener: () => {},
		removeEventListener: () => {},
		dispatchEvent: () => false,
	}),
});

if (!window.requestAnimationFrame) {
	window.requestAnimationFrame = (cb) => setTimeout(cb, 0) as any;
}

(window as any).ResizeObserver = class {
	constructor(private cb?: any) {}
	observe() {}
	unobserve() {}
	disconnect() {}
};

import "@testing-library/jest-dom/vitest";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
(function ensureLocalStorage() {
	try {
		const currentLocal = (globalThis as any).localStorage ?? (window as any).localStorage;
		if (!currentLocal || typeof currentLocal.clear !== "function") {
			let store: Record<string, string> = {};
			const makeStorage = () => ({
				getItem(key: string) {
					return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
				},
				setItem(key: string, value: string) {
					store[key] = String(value);
				},
				removeItem(key: string) {
					delete store[key];
				},
				clear() {
					store = {};
				},
				key(index: number) {
					return Object.keys(store)[index] ?? null;
				},
				get length() {
					return Object.keys(store).length;
				},
			});
			const localMock = makeStorage();
			// Assign to both window and globalThis to cover different test runtime references
			try {
				Object.defineProperty(window, "localStorage", { value: localMock, writable: true });
			} catch (e) {
				(globalThis as any).localStorage = localMock;
			}
			// Also ensure sessionStorage exists for completeness
			const sessionMock = makeStorage();
			try {
				Object.defineProperty(window, "sessionStorage", { value: sessionMock, writable: true });
			} catch (e) {
				(globalThis as any).sessionStorage = sessionMock;
			}
			// Mirror to globalThis
			(globalThis as any).localStorage = localMock;
			(globalThis as any).sessionStorage = sessionMock;
		}
	} catch (e) {
		// ignore errors in test setup
	}
})();

// Suppress Playwright's non-fatal warning about --localstorage-file being provided without a valid path
// This message originates from Playwright internals used by e2e tooling; it's harmless for unit tests
// and noisy in CI/dev runs. We only suppress that exact message substring to avoid swallowing other warnings.
if (typeof process !== "undefined" && typeof process.on === "function") {
	process.on("warning", (warning: Error & { message?: string }) => {
		const msg = warning && warning.message ? warning.message : String(warning);
		if (msg.includes("--localstorage-file")) {
			// intentionally ignore this specific Playwright storage warning in unit test runs
			return;
		}
		// For other warnings, re-emit so they show up as normal
		// Note: re-throwing or re-emitting isn't necessary here; leaving unhandled will show them.
	});
}
