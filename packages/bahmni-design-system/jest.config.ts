export default {
  displayName: '@bahmni/design-system',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: [
    '<rootDir>/../../setupTests.ts',
    '<rootDir>/src/setupTests.ts',
  ],
  testEnvironment: 'jsdom',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: 'test-output/jest/coverage',
};
