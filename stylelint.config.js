/** @type {import('stylelint').Config} */
const config = {
  files: ['src/**/*.{scss}'],
  ignoreFiles: ['src/**/*.ts', 'src/**/*.tsx'],
  extends: ['stylelint-config-standard-scss'],
  plugins: ['stylelint-scss'],
  rules: {
    'selector-class-pattern': null,
    'property-no-unknown': true,
    'at-rule-no-unknown': null,
    'scss/dollar-variable-pattern': null,
    'scss/at-mixin-pattern': null,
    'scss/percent-placeholder-pattern': null,
    'scss/at-rule-no-unknown': true,
    'scss/selector-no-redundant-nesting-selector': true,
    'scss/no-duplicate-dollar-variables': true,
    'scss/double-slash-comment-whitespace-inside': 'always',
    'scss/declaration-nested-properties': 'never',
    'scss/operator-no-unspaced': true,
    'scss/at-import-partial-extension-disallowed-list': ['scss'],
    'scss/at-function-pattern': '^[a-z]+([a-z0-9-]+[a-z0-9]+)?$',
    'property-no-vendor-prefix': null,
    'value-no-vendor-prefix': null,
    'selector-no-vendor-prefix': null,
    'at-rule-no-vendor-prefix': null,
    'selector-pseudo-class-no-unknown': [
      true,
      {
        ignorePseudoClasses: ['global', 'local'],
      },
    ],
    'declaration-empty-line-before': null,
    'rule-empty-line-before': null,
    'length-zero-no-unit': null,
    'color-hex-length': null,
    'declaration-block-no-redundant-longhand-properties': null,
    'declaration-property-unit-allowed-list': {
      '/^border|^border-radius|^border-bottom|^border-left|^border-right|^border-top|^box-shadow|^font-size/':
        ['px', 'rem'],
      '/^margin|^padding|^block|^inline|^width|^height/': [
        'rem',
        '%',
        'em',
        'vh',
        'vw',
      ],
    },
    // 'unit-allowed-list': ['%', 'deg', 'rem', 'vh', 'vw'],
  },
  ignoreFiles: [
    'node_modules/**/*',
    'dist/**/*',
    'build/**/*',
    'storybook-static/**/*',
  ],
};

export default config;
