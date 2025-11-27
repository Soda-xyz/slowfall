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
