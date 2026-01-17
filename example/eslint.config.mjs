import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import tseslint from 'typescript-eslint'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.expo/**',
      '**/android/**',
      '**/ios/**',
      'eslint.config.mjs',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
      '.prettierrc.js',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      '@stylistic': stylistic,
    },
  },
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        jest: 'readonly',
        expect: 'readonly',
        fetch: 'readonly',
        navigator: 'readonly',
        __DEV__: 'readonly',
        XMLHttpRequest: 'readonly',
        FormData: 'readonly',
        requestAnimationFrame: 'readonly',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      // Core rules
      curly: ['error', 'multi', 'consistent'],

      // TypeScript rules
      '@typescript-eslint/no-require-imports': 'off',

      // React rules
      'react/prop-types': 'off',
      'react/display-name': 'off',
      'react/jsx-uses-react': 'warn',
      'react/jsx-uses-vars': 'warn',

      // React Hooks rules
      'react-hooks/exhaustive-deps': [
        'warn',
        {
          additionalHooks:
            '(useAnimatedStyle|useSharedValue|useAnimatedGestureHandler|useAnimatedScrollHandler|useAnimatedProps|useDerivedValue|useAnimatedRef|useAnimatedReact)',
        },
      ],
      'react-hooks/rules-of-hooks': 'error',

      // Stylistic rules
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
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
    },
  },
]
