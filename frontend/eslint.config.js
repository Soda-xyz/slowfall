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
import jsdocPlugin from "eslint-plugin-jsdoc";
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
			jsdoc: jsdocPlugin,
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

			// Require JSDoc/TSDoc presence for exported symbols (warn so we can triage)
			"jsdoc/require-jsdoc": [
				"warn",
				{
					"require": {
						"FunctionDeclaration": true,
						"MethodDefinition": false,
						"ClassDeclaration": true,
						"ArrowFunctionExpression": true,
						"FunctionExpression": true
					},
					"contexts": [
						"ExportNamedDeclaration > FunctionDeclaration",
						"ExportDefaultDeclaration > FunctionDeclaration",
						"ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression",
						"ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > FunctionExpression",
						"ExportDefaultDeclaration > ArrowFunctionExpression",
						"ExportNamedDeclaration > ClassDeclaration",
						"ExportDefaultDeclaration > ClassDeclaration"
					]
				}
			],
			"jsdoc/require-description": "warn",
			"jsdoc/check-tag-names": "warn",
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
					project: [
						resolveTsConfig("./tsconfig.app.json"),
						resolveTsConfig("./tsconfig.node.json"),
					],
					alwaysTryTypes: true,
					extensions: [".js", ".jsx", ".ts", ".tsx"],
				},
			},
			// No special tsdoc settings required; plugin validates TSDoc syntax.
		},
	},
	// Test files override: parse tests as TypeScript and relax noisy rules like `no-explicit-any` and unused-vars
	{
		files: [
			"test/**/*.{js,jsx,ts,tsx}",
			"**/*.{spec,test}.{js,jsx,ts,tsx}",
			"**/setup.*",
			"test.*",
		],
		plugins: {
			"@typescript-eslint": tsEslint,
			react: reactPlugin,
			"jsx-a11y": jsxA11y,
			prettier: prettierPlugin,
			"react-hooks": reactHooks,
			import: importPlugin,
		},
		languageOptions: {
			ecmaVersion: 2020,
			sourceType: "module",
			globals: globals.browser,
			parser: tsParser,
			parserOptions: {
				ecmaVersion: 2020,
				sourceType: "module",
				// Use dedicated test tsconfig so parserOptions.project includes test files
				project: [resolveTsConfig("./tsconfig.test.json")],
				warnOnMultipleProjects: false,
			},
		},
		rules: {
			// keep the bulk of shared rules but relax a few noisy ones for tests
			...combinedRules,
			"@typescript-eslint/no-explicit-any": "off",
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": [
				"warn",
				{ argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
			],
			"import/no-extraneous-dependencies": "off",
			// Tests use JSX without explicit React import (new JSX transform) - allow this in tests
			"react/react-in-jsx-scope": "off",
		},
		settings: { react: { version: "detect" } },
	},
]);
