const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  testEnvironment: 'jsdom',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|mjs|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.(m?[tj]sx?)$': [
      'babel-jest',
      {
        presets: ['@nx/react/babel'],
        plugins: [require.resolve('./jest.import-meta-plugin.js')],
      },
    ],
  },
  // react-router v8 (and its dependencies) are ESM-only, so they must be transformed.
  transformIgnorePatterns: ['node_modules/(?!(react-router|cookie-es)/)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: 'test-output/jest/coverage',
  coverageReporters: ['html', 'text', 'lcov'],
};
