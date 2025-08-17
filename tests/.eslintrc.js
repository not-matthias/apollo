module.exports = {
  extends: ['eslint:recommended'],
  env: {
    node: true,
    es6: true,
    browser: true,
    jest: false
  },
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module'
  },
  globals: {
    // Playwright globals
    test: 'readonly',
    expect: 'readonly',
    describe: 'readonly',
    beforeEach: 'readonly',
    beforeAll: 'readonly',
    afterEach: 'readonly',
    afterAll: 'readonly'
  },
  rules: {
    'no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { 'allowTemplateLiterals': true }],
    'indent': ['error', 2],
    'comma-dangle': ['error', 'always-multiline']
  }
};