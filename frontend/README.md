# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react)
  uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used
  in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc)
  uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it,
see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
	globalIgnores(["dist"]),
	{
		files: ["**/*.{ts,tsx}"],
		extends: [
			// Other configs...

			// Remove tseslint.configs.recommended and replace with this
			tseslint.configs.recommendedTypeChecked,
			// Alternatively, use this for stricter rules
			tseslint.configs.strictTypeChecked,
			// Optionally, add this for stylistic rules
			tseslint.configs.stylisticTypeChecked,

			// Other configs...
		],
		languageOptions: {
			parserOptions: {
				project: ["./tsconfig.node.json", "./tsconfig.app.json"],
				tsconfigRootDir: import.meta.dirname,
			},
			// other options...
		},
	},
]);
```

You can also
install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x)
and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom)
for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
	globalIgnores(["dist"]),
	{
		files: ["**/*.{ts,tsx}"],
		extends: [
			// Other configs...
			// Enable lint rules for React
			reactX.configs["recommended-typescript"],
			// Enable lint rules for React DOM
			reactDom.configs.recommended,
		],
		languageOptions: {
			parserOptions: {
				project: ["./tsconfig.node.json", "./tsconfig.app.json"],
				tsconfigRootDir: import.meta.dirname,
			},
			// other options...
		},
	},
]);
```

## Stack & dev packages

This project is a React + TypeScript frontend built with Vite. The primary runtime and dev dependency versions are taken from `frontend/package.json`.

I read these versions from `frontend/package.json`:

- react: ^19.2.0 (React docs) — https://react.dev/
- typescript: ~5.9.3 (TypeScript docs) — https://www.typescriptlang.org/docs/
- vite: ^7.2.4 (Vite docs) — https://vitejs.dev/
- @mantine/core / @mantine/hooks / @mantine/notifications: ^8.3.9 (Mantine docs) — https://mantine.dev/
- eslint: ^9.39.1 (ESLint docs) — https://eslint.org/docs/latest/
- prettier: ^3.6.2 (Prettier docs) — https://prettier.io/docs/en/index.html
- vitest: ^4.0.14 (Vitest docs) — https://vitest.dev/guide/
- @playwright/test: ^1.57.0 (Playwright docs) — https://playwright.dev/docs/intro

Dev dependencies (high level):

- @typescript-eslint/parser, @typescript-eslint/eslint-plugin — Type-aware linting for TypeScript
- @vitejs/plugin-react — Vite React plugin
- eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-jsx-a11y — React-focused linting rules
- vite-plugin-checker, vite-plugin-eslint — dev-time checks for type/lint feedback in the dev server

Refer to the official docs above for API usage and configuration details.

## Useful commands

All commands assume you're in the `frontend/` folder. If you run them from the repository root, prefix with `cd "frontend";` in PowerShell.

Install dependencies

```powershell
npm install
```

Start development server (HMR)

```powershell
npm run dev
# runs: vite
```

Build production assets

```powershell
npm run build
# runs: tsc -b && vite build
```

Preview a production build locally

```powershell
npm run preview
# runs: vite preview
```

Run unit tests (Vitest)

```powershell
npm run test
# runs: vitest
```

Run end-to-end tests (Playwright)

```powershell
npm run test:e2e
# runs: playwright test
```

Lint the code (ESLint)

```powershell
npm run lint
# runs: eslint .
```

Auto-fix lintable problems

```powershell
npx eslint . --fix
```

Format code with Prettier

```powershell
npx prettier --write .
```

Type-check only

```powershell
npx tsc -b
```

Quick local check — lint, typecheck, build

```powershell
npm run lint; npx tsc -b; npm run build
```

Notes and references

- Vite commands & build guide — https://vitejs.dev/guide/commands-and-options.html
- ESLint CLI usage — https://eslint.org/docs/latest/use/command-line-interface
- Prettier CLI usage — https://prettier.io/docs/en/cli.html
- TypeScript build references (project references & -b) — https://www.typescriptlang.org/docs/handbook/project-references.html
- Vitest guide — https://vitest.dev/guide/
- Playwright test runner — https://playwright.dev/docs/test-intro

Formatting / lint rules

- This project includes Prettier and ESLint. Use the Prettier CLI above to format files and `npx eslint . --fix` to automatically fix lintable issues. For stricter type-aware lint checks, consider enabling type-aware ESLint configs and run ESLint with the appropriate parserOptions.project setting (see ESLint docs and `eslint.config.js`).

If you'd like, I can add convenience npm scripts for `format` and `lint:fix` to `package.json` (for example: `"format": "prettier --write .", "lint:fix": "eslint . --fix"`).
