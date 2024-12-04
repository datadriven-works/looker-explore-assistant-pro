import { Linter } from 'eslint'

/** @type {Linter.Config} */
const config = {
  env: {
    browser: true,
    es2022: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'prettier' // Add Prettier if using it
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended' // Integrate Prettier
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'react/react-in-jsx-scope': 'off', // Disable React import requirement for Next.js
    'react/prop-types': 'off', // Disable prop-types as we use TypeScript
    'prettier/prettier': 'warn' // Integrate Prettier formatting rules as warnings
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // Add TypeScript-specific overrides here if needed
      },
    },
  ],
}

export default config
