import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';
import n from 'eslint-plugin-n';
import promise from 'eslint-plugin-promise';
import prettier from 'eslint-config-prettier';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  js.configs.recommended,
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      import: importPlugin,
      n,
      promise,
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      ...prettier.rules,
      'no-console': 'off',
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'import/order': [
        'error',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'n/no-missing-import': 'off'
    },
  },
];

