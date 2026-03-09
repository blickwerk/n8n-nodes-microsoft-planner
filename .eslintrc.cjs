module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['n8n-nodes-base'],
  extends: [
    'plugin:n8n-nodes-base/nodes',
    'plugin:n8n-nodes-base/credentials',
    'plugin:n8n-nodes-base/community',
  ],
  ignorePatterns: ['dist/**', 'node_modules/**', 'package.json'],
};
