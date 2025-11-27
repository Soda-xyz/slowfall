// Polyfill matchMedia for Mantine and other libs that use it in tests
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Optional: provide requestAnimationFrame if missing
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (cb) => setTimeout(cb, 0) as any
}

// Polyfill ResizeObserver used by Mantine ScrollArea and other components
// Minimal implementation: no-op observer
;(window as any).ResizeObserver = class {
  constructor(private cb?: any) {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Add jest-dom matchers in Vitest environment only
import '@testing-library/jest-dom/vitest';
