import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/**/*.{test,spec}.{ts,tsx,js,jsx}", "test/**/*.{test,spec}.{ts,tsx,js,jsx}"],
		environment: "jsdom",
		exclude: ["**/tests/e2e/**", "**/e2e/**", "**/node_modules/**"],
		globals: true,
		setupFiles: ["./test/setup.ts"],
	},
});
