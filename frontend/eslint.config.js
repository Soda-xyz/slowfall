import js from "@eslint/js";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import tsEslint from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierPlugin from "eslint-plugin-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import importPlugin from "eslint-plugin-import";
import tsdocPlugin from "eslint-plugin-tsdoc";
import { defineConfig, globalIgnores } from "eslint/config";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const resolveTsConfig = (p) => resolve(__dirname, p);

const getRules = (cfg) => (cfg && cfg.rules ? cfg.rules : {});

const combinedRules = Object.assign(
	{},
	getRules(js.configs.recommended),
	getRules(tsEslint.configs?.recommended),
	getRules(reactPlugin.configs?.recommended),
	getRules(reactHooks.configs?.recommended),
	getRules(jsxA11y.configs?.recommended),
);

export default defineConfig([
	globalIgnores(["dist"]),
	{
		files: ["src/**/*.{ts,tsx}", "vite.config.ts", "src/types/**/*.d.ts"],
		plugins: {
			"@typescript-eslint": tsEslint,
			react: reactPlugin,
			"jsx-a11y": jsxA11y,
			prettier: prettierPlugin,
			"react-hooks": reactHooks,
			import: importPlugin,
			tsdoc: tsdocPlugin,
		},
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: "module",
			globals: globals.browser,
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: "module",
				project: [resolveTsConfig("./tsconfig.app.json"), resolveTsConfig("./tsconfig.node.json")],
				warnOnMultipleProjects: false,
			},
		},
		linterOptions: {
			reportUnusedDisableDirectives: true,
		},
		rules: {
			...combinedRules,
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					vars: "all",
					args: "after-used",
					ignoreRestSiblings: true,
					varsIgnorePattern: "^_",
					argsIgnorePattern: "^_",
				},
			],
			indent: "off",
			"prettier/prettier": ["error"],
			"react/react-in-jsx-scope": "off",
			"react-hooks/rules-of-hooks": "error",
			"react-hooks/exhaustive-deps": "warn",
			"import/extensions": [
				"error",
				"ignorePackages",
				{ js: "never", jsx: "never", ts: "never", tsx: "never" },
			],
			// Require explicit types on exported functions/classes (warn)
			"@typescript-eslint/explicit-module-boundary-types": ["warn"],
			// Validate TSDoc syntax (warn-level as requested)
			"tsdoc/syntax": ["warn"],
			// Disallow single-letter variable names in most contexts to improve readability.
			// Allows common loop indices and error variables: e, E, i, j, k.
			// This uses ESLint core rule `id-length` (https://eslint.org/docs/latest/rules/id-length).
			"id-length": [
				"warn",
				{
					min: 2,
					exceptions: ["e", "E", "i", "j", "k"],
					properties: "never",
				},
			],
		},
		settings: {
			react: { version: "detect" },
			"import/resolver": {
				typescript: {
					project: [resolveTsConfig("./tsconfig.app.json"), resolveTsConfig("./tsconfig.node.json")],
					alwaysTryTypes: true,
					extensions: [".js", ".jsx", ".ts", ".tsx"],
				},
			},
			// No special tsdoc settings required; plugin validates TSDoc syntax.
		},
	},
]);
