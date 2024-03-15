module.exports = {
  root: true,
  env: {
    es2020: true,
    jest: true,
  },
  parser: '@babel/eslint-parser',
  extends: [
    'standard',
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 11,
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  rules: {
    indent: [
      'error',
      2, {
        SwitchCase: 1,
        ignoredNodes: [
          'TemplateLiteral',
        ],
      },
    ],
    'template-curly-spacing': 'off',
    'linebreak-style': [
      'error',
      'unix',
    ],
    quotes: [
      'error',
      'single',
    ],
    semi: [
      'error',
      'never',
    ],
    'comma-dangle': [
      'error',
      {
        arrays: 'always-multiline',
        objects: 'always-multiline',
        imports: 'always-multiline',
        exports: 'never',
        functions: 'never',
      },
    ],
    'no-func-assign': 'off',
    'no-class-assign': 'off',
    'no-useless-escape': 'off',
    curly: [2, 'multi', 'consistent'],
    'react/prop-types': 'off', // TODO: TURN ON AND FIX ALL WARNINGS
    'react/display-name': 'off',
    'react-hooks/exhaustive-deps': ['warn', {
      additionalHooks: '(useAnimatedStyle|useSharedValue|useAnimatedGestureHandler|useAnimatedScrollHandler|useAnimatedProps|useDerivedValue|useAnimatedRef|useAnimatedReact)',
      // useAnimatedReaction
      // USE RULE FUNC/FUNC/DEPS
    }],
  },
  globals: {
    describe: 'readonly',
    test: 'readonly',
    jest: 'readonly',
    expect: 'readonly',
    fetch: 'readonly',
    navigator: 'readonly',
    __DEV__: 'readonly',
    XMLHttpRequest: 'readonly',
    FormData: 'readonly',
    React$Element: 'readonly',
    requestAnimationFrame: 'readonly',
  },
}
