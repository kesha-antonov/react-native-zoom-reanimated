module.exports = {
  root: true,

  env: {
    browser: true,
    node: true,
  },

  ignorePatterns: [
    '.eslintrc.js',
    '**/node_modules/**',
  ],

  plugins: [
    'react',
    'react-hooks',
    'eslint-plugin-import',
    'eslint-plugin-react',
    '@typescript-eslint',
  ],

  settings: {
    react: {
      version: 'detect',
    },
    'import/ignore': ['react-native'],
  },

  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
  ],

  parser: '@typescript-eslint/parser',

  parserOptions: {
    project: 'tsconfig.json',
    sourceType: 'module',
    ecmaFeatures: {
      JSX: true,
    },
  },

  globals: {
    JSX: true,
    React: true,
    '__DEV__': true,
    'NodeJS': true
  },

  rules: {
    '@typescript-eslint/adjacent-overload-signatures': 'error',
    '@typescript-eslint/consistent-type-definitions': [
      'error',
      'interface',
    ],
    '@typescript-eslint/await-thenable': 'error',
    'no-sequences': 'error',
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'variable',
        format: [
          'camelCase',
          'UPPER_CASE',
          'PascalCase',
          'snake_case',
        ],
        'filter': {
          'regex': '[a-z]+((\\d)|([A-Z0-9][a-z0-9_]+))*([A-Z])?',
          'match': false,
        },
        leadingUnderscore: 'allow',
        trailingUnderscore: 'forbid',
      },
      {
        selector: 'class',
        format: [
          'PascalCase',
        ],
      },
      {
        selector: 'interface',
        format: [
          'PascalCase',
        ],
      },
    ],
    'no-shadow-restricted-names': 'warn',
    'spaced-comment': [
      'error',
      'always',
      {
        exceptions: [
          '*',
        ],
        markers: [
          '/',
        ],
      },
    ],
    curly: [2, 'multi', 'consistent'],
    'eol-last': 'error',
    'guard-for-in': 'error',
    indent: 'off',
    '@typescript-eslint/indent': [
      'error',
      2,
      {
        CallExpression: {
          arguments: 'first',
        },
        FunctionDeclaration: {
          parameters: 'first',
        },
        FunctionExpression: {
          parameters: 'first',
        },
        SwitchCase: 1,
        VariableDeclarator: 1,
        ignoredNodes: ['TSTypeParameterInstantiation'],
      },
    ],
    'no-extra-label': 'warn',
    'no-unused-labels': 'error',
    'no-label-var': 'warn',
    'no-labels': [
      'warn',
      {
        allowLoop: true,
        allowSwitch: false,
      },
    ],
    'linebreak-style': [
      'error',
      'unix',
    ],
    'max-len': [
      'error',
      {
        code: 120,
        ignoreTemplateLiterals: true,
      },
    ],
    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      {
        accessibility: 'explicit',
        ignoredMethodNames: [],
        overrides: {
          constructors: 'off',
          parameterProperties: 'off',
        },
      },
    ],
    '@typescript-eslint/member-ordering': [
      'error',
      {
        default: [
          'public-static-field',
          'protected-static-field',
          'private-static-field',
          'public-static-method',
          'protected-static-method',
          'private-static-method',
          'constructor',
          'public-abstract-field',
          'public-abstract-method',
          'protected-abstract-field',
          'protected-abstract-method',
          'public-field',
          'protected-field',
          'private-field',
          'public-method',
          'protected-method',
          'private-method',
        ],
      },
    ],

    'new-parens': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    'no-caller': 'error',
    'no-bitwise': 'error',
    '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'warn',
    'no-cond-assign': 'error',
    'no-console': [
      'error',
      {
        allow: [
          'warn',
          'dir',
          'timeLog',
          'assert',
          'clear',
          'count',
          'countReset',
          'group',
          'groupEnd',
          'table',
          'dirxml',
          'groupCollapsed',
          'Console',
          'profile',
          'profileEnd',
          'timeStamp',
          'context',
        ],
      },
    ],
    'no-multiple-empty-lines': [
      'error',
      {
        max: 1,
      },
    ],
    'no-new-func': 'warn',
    'no-new-object': 'warn',
    'no-new-symbol': 'warn',
    'no-new-wrappers': 'error',
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-duplicate-case': 'error',
    'no-redeclare': 'error',
    'no-empty': [
      'error',
      {
        allowEmptyCatch: true,
      },
    ],
    'no-eval': 'error',
    'no-implied-eval': 'warn',
    '@typescript-eslint/no-floating-promises': 'error',
    'no-return-await': 'error',
    '@typescript-eslint/no-for-in-array': 'error',
    'import/first': 'error',
    'import/no-deprecated': 'error',
    'import/no-amd': 'error',
    'import/no-anonymous-default-export': 'warn',
    'import/no-webpack-loader-syntax': 'error',
    'no-template-curly-in-string': 'error',
    'no-invalid-this': 'off',
    '@typescript-eslint/no-invalid-this': 'error',
    'no-irregular-whitespace': 'error',
    '@typescript-eslint/no-misused-new': 'error',
    'no-param-reassign': 'error',
    '@typescript-eslint/triple-slash-reference': 'error',
    'no-sparse-arrays': 'error',
    'dot-notation': 'off',
    '@typescript-eslint/dot-notation': 'error',
    'no-fallthrough': 'error',
    'no-throw-literal': 'error',
    'no-trailing-spaces': 'error',
    '@typescript-eslint/no-extraneous-class': 'error',
    'no-this-before-super': 'warn',
    'no-undef': 'error',
    'no-undef-init': 'error',
    '@typescript-eslint/no-unnecessary-qualifier': 'warn',
    'no-unsafe-finally': 'error',
    'no-unused-expressions': 'off',
    '@typescript-eslint/no-unused-expressions': [
      'error',
      {
        'allowShortCircuit': true,
        'allowTernary': true,
      },
    ],
    'no-var': 'error',
    'quote-props': [
      'error',
      'as-needed',
      {
        unnecessary: false,
      },
    ],
    quotes: [
      'error',
      'single',
      {
        allowTemplateLiterals: true,
      },
    ],

    'jsx-quotes': ['error', 'prefer-double'],

    'brace-style': [
      'error',
      '1tbs',
    ],
    'prefer-const': 'error',
    '@typescript-eslint/prefer-for-of': 'error',
    'prefer-object-spread': 'error',
    '@typescript-eslint/promise-function-async': 'error',
    radix: 'error',
    '@typescript-eslint/restrict-plus-operands': 'error',
    semi: [
      'error',
      'never',
    ],
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: {
          delimiter: 'semi',
          requireLast: true,
        },
        singleline: {
          delimiter: 'semi',
          requireLast: false,
        },
      },
    ],
    'space-before-function-paren': [
      'error',
      'never',
    ],
    'space-in-parens': [
      'off',
      'never',
    ],
    'default-case': 'error',
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
    eqeqeq: [
      'error',
      'always',
    ],
    '@typescript-eslint/typedef': [
      'error',
      {
        parameter: true,
        propertyDeclaration: true,
      },
    ],
    '@typescript-eslint/type-annotation-spacing': 'error',
    'use-isnan': 'error',
    'no-unused-vars': [
      'error',
      {
        args: 'none',
        ignoreRestSiblings: true,
      },
    ],
    '@typescript-eslint/no-unnecessary-condition': 'error',
    'consistent-return': 'error',
    '@typescript-eslint/method-signature-style': [
      'error',
      'method',
    ],
    'prefer-numeric-literals': 'error',
    '@typescript-eslint/no-namespace': 'error',
    'object-curly-spacing': ['warn', 'always'],
    'react/jsx-curly-spacing': ['error', {
      attributes: { when: 'never' },
      children: { when: 'never' },
      allowMultiline: true,
    }],
    'no-multi-spaces': 'error',
    'no-whitespace-before-property': 'warn',
    'space-before-blocks': 'error',
    'space-infix-ops': 'error',
    'space-unary-ops': 'error',
    'switch-colon-spacing': 'error',
    'template-curly-spacing': 'error',
    'template-tag-spacing': 'error',
    'yield-star-spacing': 'error',
    'array-bracket-spacing': 'error',
    'arrow-spacing': 'error',
    'block-spacing': 'error',
    'comma-spacing': 'error',
    'computed-property-spacing': 'error',
    'func-call-spacing': 'error',
    'generator-star-spacing': 'error',
    'key-spacing': 'error',
    'keyword-spacing': 'error',
    'no-mixed-spaces-and-tabs': 'error',

    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react/jsx-key': 'error',
    'react/jsx-no-bind': 'off',
    'react/jsx-no-comment-textnodes': 'warn',
    'react/jsx-no-duplicate-props': 'warn',
    'react/jsx-no-target-blank': 'warn',
    'react/jsx-no-undef': 'error',
    'react/jsx-pascal-case': [
      'error',
      {
        'allowAllCaps': true,
      },
    ],
    'react/jsx-uses-react': 'warn',
    'react/jsx-uses-vars': 'warn',
    'react/no-danger-with-children': 'warn',
    'react/no-direct-mutation-state': 'warn',
    'react/no-is-mounted': 'warn',
    'react/no-typos': 'error',
    'react/require-render-return': 'error',
    'react/self-closing-comp': 'error',
    'react/style-prop-object': 'error',
    'react/jsx-closing-tag-location': 'error',
    'react/jsx-closing-bracket-location': 'error',

    'no-case-declarations': 'off',
    'no-extra-boolean-cast': 'off',
    'no-dupe-class-members': 'off',
    'react/no-find-dom-node': 'off',
  },
};
