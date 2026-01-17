import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import importPlugin from 'eslint-plugin-import'

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      'example/**',
      '.eslintrc.js',
      'eslint.config.mjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  stylistic.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        JSX: 'readonly',
        React: 'readonly',
        __DEV__: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint.plugin,
      react,
      'react-hooks': reactHooks,
      import: importPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/ignore': ['react-native'],
    },
    rules: {
      // TypeScript rules
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/method-signature-style': ['error', 'property'],
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],

      // Core ESLint rules
      curly: ['error', 'multi', 'consistent'],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],

      // Import plugin rules
      'import/first': 'error',
      'import/no-duplicates': 'error',

      // React rules
      'react/jsx-key': 'error',
      'react/jsx-uses-react': 'warn',
      'react/jsx-uses-vars': 'warn',
      'react/self-closing-comp': 'error',

      // React Hooks rules
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',

      // Stylistic overrides (customize recommended)
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/quotes': ['error', 'single', { allowTemplateLiterals: 'always' }],
      '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
      '@stylistic/max-len': ['error', { code: 120, ignoreTemplateLiterals: true }],
      '@stylistic/comma-dangle': [
        'error',
        {
          arrays: 'always-multiline',
          objects: 'always-multiline',
          imports: 'always-multiline',
          exports: 'never',
          functions: 'never',
        },
      ],
      '@stylistic/member-delimiter-style': [
        'error',
        {
          multiline: { delimiter: 'none', requireLast: false },
          singleline: { delimiter: 'semi', requireLast: false },
        },
      ],
    },
  },
]
