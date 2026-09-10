export const nodeEnvironment = {
  files: ['scripts/**/*.mjs', 'eslint.config.js', 'eslint/**/*.js'],
  languageOptions: {
    globals: {
      process: 'readonly',
      console: 'readonly',
      __dirname: 'readonly'
    }
  }
};
