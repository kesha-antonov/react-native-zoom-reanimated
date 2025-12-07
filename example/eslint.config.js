import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
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
      '.eslintrc.js',
      'eslint.config.js',
      'babel.config.js',
      'metro.config.js',
      'jest.config.js',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.jsx', '**/*.ts', '**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        // Browser/Node
        console: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        // Testing
        describe: 'readonly',
        test: 'readonly',
        jest: 'readonly',
        expect: 'readonly',
        // React Native
        fetch: 'readonly',
        navigator: 'readonly',
        __DEV__: 'readonly',
        XMLHttpRequest: 'readonly',
        FormData: 'readonly',
        React$Element: 'readonly',
        requestAnimationFrame: 'readonly',
        // Expo
        Expo: 'readonly',
      },
    },
    plugins: {
      '@stylistic': stylistic,
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
      'no-func-assign': 'off',
      'no-class-assign': 'off',
      'no-useless-escape': 'off',

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

      // Stylistic rules (formatting)
      '@stylistic/indent': [
        'error',
        2,
        {
          SwitchCase: 1,
          ignoredNodes: ['TemplateLiteral'],
        },
      ],
      '@stylistic/template-curly-spacing': 'off',
      '@stylistic/linebreak-style': ['error', 'unix'],
      '@stylistic/quotes': ['error', 'single'],
      '@stylistic/semi': ['error', 'always'],
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
