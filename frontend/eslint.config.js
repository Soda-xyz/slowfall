import js from '@eslint/js'
import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import tsEslint from '@typescript-eslint/eslint-plugin'
import reactPlugin from 'eslint-plugin-react'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import prettierPlugin from 'eslint-plugin-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'
import { defineConfig, globalIgnores } from 'eslint/config'

// Helper to safely read a plugin config's rules (some configs may not expose rules)
const getRules = (cfg) => (cfg && cfg.rules) ? cfg.rules : {}

// Merge recommended rules from the core JS config and selected plugins.
const combinedRules = Object.assign(
  {},
  getRules(js.configs.recommended),
  getRules(tsEslint.configs?.recommended),
  getRules(reactPlugin.configs?.recommended),
  getRules(reactHooks.configs?.recommended),
  getRules(jsxA11y.configs?.recommended)
)

export default defineConfig([
  globalIgnores(['dist']),
  // Disable type-aware linting for test/e2e/config files (they are not
  // included in the project tsconfigs). This prevents
  // "file was not found in any of the provided project(s)" errors from
  // @typescript-eslint/parser while allowing normal linting.
  {
    files: [
      '**/*.{spec.ts,spec.tsx,test.ts,test.tsx}',
      'e2e/**',
      'test/**',
      'e2e/**/*.ts',
      'e2e/**/*.tsx',
      'vitest.config.ts',
      'playwright.config.ts',
    ],
    plugins: {
      '@typescript-eslint': tsEslint,
      react: reactPlugin,
      'jsx-a11y': jsxA11y,
      prettier: prettierPlugin,
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
      parser: tsParser,
      // IMPORTANT: No `parserOptions.project` here so parser doesn't try to
      // create a program for files that aren't part of the referenced TS
      // projects.
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        // Avoid noisy "Multiple projects found" warnings when multiple tsconfigs
        // are present in the workspace.
        warnOnMultipleProjects: false,
      },
    },
    rules: {
      // Use the same combined rules but avoid enabling rules that strictly
      // require type information. Consumers can further tune this.
      ...combinedRules,
    },
    // Ensure eslint-plugin-react can auto-detect the installed React version
    // and avoid the "React version not specified" warning. See plugin docs:
    // https://github.com/jsx-eslint/eslint-plugin-react#configuration
    settings: {
      react: { version: 'detect' },
    },
  },
  {
    // Apply type-aware rules only to files that are included in the TS configs.
    // This prevents files like test/setup.ts or vitest.config.ts (which are
    // not referenced by those tsconfigs) from being parsed with
    // parserOptions.project.
    files: ['src/**/*.{ts,tsx}', 'vite.config.ts', 'src/types/**/*.d.ts'],
    // extends: [js.configs.recommended],
    // Use core recommended base and plugin rule sets by merging their rules
    // rather than `extends` to avoid nested-extends issues with flat config.
    plugins: {
      '@typescript-eslint': tsEslint,
      react: reactPlugin,
      'jsx-a11y': jsxA11y,
      prettier: prettierPlugin,
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        // Point to the actual tsconfig files that include the linted files.
        // Using an array avoids the `The file was not found in any of the provided project(s)`
        // error from @typescript-eslint/parser when the root `tsconfig.json` uses
        // references. See: https://github.com/typescript-eslint/typescript-eslint#project
        project: ['./tsconfig.app.json', './tsconfig.node.json'],
        // Avoid the noisy "Multiple projects found" warning when ESLint
        // discovers more than one tsconfig in the repo.
        warnOnMultipleProjects: false,
      },
    },
    linterOptions: {
      reportUnusedDisableDirectives: true,
    },
    rules: {
      // Start with a merged set of recommended rules from core + plugins.
      ...combinedRules,
      // Use the TypeScript-aware no-unused-vars rule and disable the base rule
      // to avoid duplicate/conflicting reports. Configure to ignore underscore
      // prefixed params/vars and rest siblings which are common in React code.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        vars: 'all',
        args: 'after-used',
        ignoreRestSiblings: true,
        varsIgnorePattern: '^_',
        argsIgnorePattern: '^_'
      }],
      // Let Prettier control indentation. Disable ESLint's indent rule to
      // avoid fights. Prettier's formatting errors are surfaced via
      // prettier/prettier (see .prettierrc for useTabs:true).
      indent: 'off',
      'prettier/prettier': ['error'],
      // Project-specific overrides (tweak as needed):
      // Allow JSX runtime automatic import (React 17+). If you still see
      // 'React' is not defined, we can add more specific rule tweaks.
      'react/react-in-jsx-scope': 'off',
      // Keep react-hooks recommended enforcement
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Allow omitting extensions for these file types in import specifiers
      'import/extensions': ['error', 'ignorePackages', { js: 'never', jsx: 'never', ts: 'never', tsx: 'never' }],
    },
    settings: {
      react: { version: 'detect' },
      // Configure import resolver so eslint-plugin-import understands TS extensions
      'import/resolver': {
        typescript: {
          // Use project files so paths/aliases are resolved
          project: ['./tsconfig.app.json', './tsconfig.node.json'],
          alwaysTryTypes: true,
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
      },
    },
  },
])
