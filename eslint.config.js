import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['scripts/**/*.mjs', 'eslint.config.js'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly'
      }
    }
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-explicit-any': 'error'
    }
  }
);