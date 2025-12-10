/* eslint-disable */
/* global process */

import "@testing-library/jest-dom/vitest";

import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/dates/styles.css";
import { logger } from "../src/lib/log";

// Provide plain-JS aliases so we can avoid TypeScript `as` casts which some linters/parsers choke on
const anyWindow = window;
const anyGlobal = globalThis;

Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: (query) => ({
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
	window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
}

// Define a JS-only ResizeObserver mock without TypeScript-only syntax
const ResizeObserverMock = class {
	constructor(cb) {
		// attach cb without triggering TypeScript property existence errors
		try {
			Object.defineProperty(this, "cb", { value: cb, writable: true });
		} catch (e) {
			// If defineProperty fails (extremely unlikely), do not attempt a direct assignment
			// because some TypeScript configurations will treat that as a property access
			// on a type that doesn't declare `cb` and emit TS2339.
		}
	}
	observe() {}
	unobserve() {}
	disconnect() {}
};

try {
	Object.defineProperty(anyWindow, "ResizeObserver", {
		value: ResizeObserverMock,
		configurable: true,
		writable: true,
	});
} catch (e) {
	// fallback: assign directly
	anyWindow.ResizeObserver = ResizeObserverMock;
}

(function ensureLocalStorage() {
	try {
		const currentLocal = anyGlobal.localStorage ?? anyWindow.localStorage;
		if (!currentLocal || typeof currentLocal.clear !== "function") {
			let store = {};
			const makeStorage = () => ({
				getItem(key) {
					return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
				},
				setItem(key, value) {
					store[key] = String(value);
				},
				removeItem(key) {
					delete store[key];
				},
				clear() {
					store = {};
				},
				key(index) {
					return Object.keys(store)[index] ?? null;
				},
				get length() {
					return Object.keys(store).length;
				},
			});
			const localMock = makeStorage();
			// Assign to both window and globalThis to cover different test runtime references
			try {
				Object.defineProperty(anyWindow, "localStorage", { value: localMock, writable: true });
			} catch (e) {
				// Define on globalThis as a non-enumerable configurable property to avoid readonly assignment errors
				try {
					Object.defineProperty(anyGlobal, "localStorage", {
						value: localMock,
						writable: true,
						configurable: true,
					});
				} catch (e2) {
					// Intentionally do not fall back to direct assignment here because some runtimes
					// expose readonly globals; if defineProperty fails, tests will still proceed without
					// mutating the global directly.
					logger.debug("test setup: failed to define localStorage on global/window:", e);
				}
			}
			// Also ensure sessionStorage exists for completeness
			const sessionMock = makeStorage();
			try {
				Object.defineProperty(anyWindow, "sessionStorage", { value: sessionMock, writable: true });
			} catch (e) {
				try {
					Object.defineProperty(anyGlobal, "sessionStorage", {
						value: sessionMock,
						writable: true,
						configurable: true,
					});
				} catch (e2) {
					// Do not assign directly to globalThis.sessionStorage to avoid readonly assignment errors
				}
			}
			// Mirror to globalThis
			try {
				Object.defineProperty(anyGlobal, "localStorage", {
					value: localMock,
					writable: true,
					configurable: true,
				});
			} catch (e) {
				logger.debug("test setup: failed to mirror local/session storage to globalThis:", e);
			}
			try {
				Object.defineProperty(anyGlobal, "sessionStorage", {
					value: sessionMock,
					writable: true,
					configurable: true,
				});
			} catch (e) {
				logger.debug("test setup: failed to mirror local/session storage to globalThis:", e);
			}
		}
	} catch (e) {
		logger.debug("test setup: error in ensureLocalStorage:", e);
	}
})();

// Suppress Playwright's non-fatal warning about --localstorage-file being provided without a valid path
// This message originates from Playwright internals used by e2e tooling; it's harmless for unit tests
// and noisy in CI/dev runs. We only suppress that exact message substring to avoid swallowing other warnings.
if (typeof process !== "undefined" && typeof process.on === "function") {
	process.on("warning", (warning) => {
		const msg = warning && warning.message ? warning.message : String(warning);
		if (msg.includes("--localstorage-file")) {
			// intentionally ignore this specific Playwright storage warning in unit test runs
			return;
		}
		// For other warnings, re-emit so they show up as normal
		// Note: re-throwing or re-emitting isn't necessary here; leaving unhandled will show them.
	});
}
