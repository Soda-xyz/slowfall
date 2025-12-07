import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import checker from "vite-plugin-checker";

export default defineConfig({
	plugins: [react(), checker({ typescript: true })],
	server: {
		port: 5173,
		proxy: {
			"/api": {
				target: "http://localhost:8080",
				changeOrigin: true,
				secure: false,
				/**
				 * Rewrite API path before proxying to the backend.
				 */
				rewrite: (path) => path.replace(/^\/api/, "/api"),
			},
		},
	},
});
