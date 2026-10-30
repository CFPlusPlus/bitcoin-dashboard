import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist/**', '.wrangler/**', 'coverage/**', 'node_modules/**']),
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/test/functions.test.ts'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/test/**'],
    extends: [reactHooks.configs.flat.recommended],
  },
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/test/**'],
    extends: [reactRefresh.configs.vite],
  },
  {
    files: ['src/test/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.vitest },
  },
  {
    files: ['functions/**/*.ts', 'src/test/functions.test.ts'],
    languageOptions: { globals: globals.worker },
  },
  {
    files: ['*.config.{js,mjs,cjs,ts}'],
    languageOptions: { globals: globals.node },
  },
  prettier,
])
