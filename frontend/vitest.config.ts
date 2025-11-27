import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Run unit/component tests in jsdom only from `src` and `test` directories.
    // Exclude e2e tests so Vitest won't try to run Playwright specs.
    // Based on Vitest docs: https://vitest.dev/config/#test-include
    include: ['src/**/*.{test,spec}.{ts,tsx,js,jsx}', 'test/**/*.{test,spec}.{ts,tsx,js,jsx}'],
    environment: 'jsdom',
    exclude: ['**/tests/e2e/**', '**/e2e/**', '**/node_modules/**'],
    globals: true,
    setupFiles: ['./test/setup.ts'],
  },
})
