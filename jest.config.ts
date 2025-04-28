import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.(ts|tsx)$': 'babel-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(ts|tsx)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.ts',
    '@/(.*)$': ['<rootDir>/src/$1'],
    '@components/(.*)$': ['<rootDir>/src/components/$1'],
    '@contexts/(.*)$': ['<rootDir>/src/contexts/$1'],
    '@constants/(.*)$': ['<rootDir>/src/constants/$1'],
    '@hooks/(.*)$': ['<rootDir>/src/hooks/$1'],
    '@services/(.*)$': ['<rootDir>/src/services/$1'],
    '@types/(.*)$': ['<rootDir>/src/types/$1'],
    '@utils/(.*)$': ['<rootDir>/src/utils/$1'],
    '@providers/(.*)$': ['<rootDir>/src/providers/$1'],
    '@schemas/(.*)$': ['<rootDir>/src/schemas/$1'],
    '@__mocks__/(.*)$': ['<rootDir>/src/__mocks__/$1'],
    '@layouts/(.*)$': ['<rootDir>/src/layouts/$1'],
    '@displayControls/(.*)$': ['<rootDir>/src/displayControls/$1'],
    '@pages/(.*)$': ['<rootDir>/src/pages/$1'],
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  collectCoverageFrom: ['<rootDir>/src/**/*.{ts,tsx}'],
  coverageReporters: ['text', 'lcov'],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/constants',
    '<rootDir>/src/styles',
    '<rootDir>/src/__mocks__',
    '<rootDir>/src/setupTests.ts',
    '<rootDir>/src/types',
    '.*\\.stories\\.tsx$',
    '<rootDir>/src/i18n.ts',
    '<rootDir>/src/setupTests.i18n.ts',
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
