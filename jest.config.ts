import type { Config } from '@jest/types';

const nxPreset = require('@nx/jest/preset').default;

const config: Config.InitialOptions = {
  ...nxPreset,
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/../setupTests.ts'],
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/react/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '**/constants',
    '**/styles',
    '**/__mocks__',
    '**/setupTests.ts',
    '**/types',
    '**/.*/stories/',
  ],
  coverageThreshold: {
    global: {
      lines: 90,
      branches: 90,
      functions: 90,
      statements: 90,
    },
  },
};

export default config;
