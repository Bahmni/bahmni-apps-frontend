import pluginJs from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import pluginEslintComments from 'eslint-plugin-eslint-comments';
import pluginImport from 'eslint-plugin-import';
import pluginJest from 'eslint-plugin-jest';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginPrettier from 'eslint-plugin-prettier';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
  // Performance optimization: Comprehensive ignore patterns
  {
    ignores: [
      '**/*.stories.{js,jsx,ts,tsx}',
      'build/**',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.config.{js,ts}',
      'declarations.d.ts',
      'public/**',
      'package/**',
    ],
  },

  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
  prettierConfig,

  {
    files: ['**/*.{js,ts,jsx,tsx}'],
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      'jsx-a11y': pluginJsxA11y,
      import: pluginImport,
      prettier: pluginPrettier,
      'eslint-comments': pluginEslintComments,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.json',
          extensions: ['.ts', '.tsx', '.js', '.jsx'],
        },
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          moduleDirectory: ['node_modules', 'src'],
        },
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },
    languageOptions: {
      globals: globals.browser,
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      quotes: [
        'error',
        'single',
        {
          allowTemplateLiterals: true,
          avoidEscape: true,
        },
      ],

      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',

      // React rules optimized for performance
      'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
      'react/jsx-pascal-case': 'error',
      'react/jsx-closing-bracket-location': 'error',
      'react/jsx-curly-spacing': ['error', 'never'],
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-no-useless-fragment': 'error',
      'react/jsx-key': 'error',
      'react/no-array-index-key': 'error',
      'react/self-closing-comp': 'error',
      'react/no-unused-prop-types': 'error',
      'react/prop-types': ['error', { skipUndeclared: true }],
      // 'react/prop-types': 'off', // TypeScript handles prop validation

      // React Hooks
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // Accessibility (essential rules only for performance)
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/anchor-is-valid': 'error',

      'no-console': 'error',

      // Prettier integration
      'prettier/prettier': 'error',

      // Import plugin rules
      'import/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],
      'import/no-unresolved': 'off', // Temporarily disabled due to path resolution issues
      'import/no-duplicates': 'error',
      'import/no-unused-modules': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',

      // ESLint comments plugin rules
      'eslint-comments/disable-enable-pair': 'error',
      'eslint-comments/no-duplicate-disable': 'error',
      'eslint-comments/no-unused-disable': 'error',
      'eslint-comments/no-unused-enable': 'error',

      // Avoid direct style prop usage
      'react/forbid-dom-props': [
        'error',
        {
          forbid: [
            {
              propName: 'style',
              message: 'Use CSS classes instead of inline styles',
            },
          ],
        },
      ],
    },
  },

  // Jest configuration for test files
  {
    files: [
      '**/*.test.{js,jsx,ts,tsx}',
      '**/*.spec.{js,jsx,ts,tsx}',
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
    ],
    plugins: {
      jest: pluginJest,
    },
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      ...pluginJest.configs.recommended.rules,
      'jest/prefer-expect-assertions': 'off',
      'jest/prefer-to-have-length': 'error',
      'jest/prefer-to-be': 'error',
      'jest/no-duplicate-hooks': 'error',
      'jest/no-test-return-statement': 'error',
    },
  },
];

export default config;
