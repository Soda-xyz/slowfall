module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: { ecmaVersion: 2024, sourceType: 'module', ecmaFeatures: { jsx: true } },
    plugins: ['@typescript-eslint', 'react', 'jsx-a11y', 'emotion'],
    extends: [
        'eslint:recommended',
        'plugin:react/recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:jsx-a11y/recommended',
        'plugin:prettier/recommended'
    ],
    settings: { react: { version: 'detect' } },
    rules: {
        // project preferences (examples)
        'react/react-in-jsx-scope': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        // Let Prettier control indentation. Disable ESLint's indent rule.
        'indent': 'off',
        'prettier/prettier': ['error']
    }
};
