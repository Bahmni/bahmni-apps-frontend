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
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
    '@components/(.*)$': ['<rootDir>/src/components/$1'],
    '@contexts/(.*)$': ['<rootDir>/src/contexts/$1'],
    '@constants/(.*)$': ['<rootDir>/src/constants/$1'],
    '@hooks/(.*)$': ['<rootDir>/src/hooks/$1'],
    '@services/(.*)$': ['<rootDir>/src/services/$1'],
    '@types/(.*)$': ['<rootDir>/src/types/$1'],
    '@utils/(.*)$': ['<rootDir>/src/utils/$1'],
    '@providers/(.*)$': ['<rootDir>/src/providers/$1'],
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  coveragePathIgnorePatterns: [
    '<rootDir>/src/constants',
    '<rootDir>/src/styles',
  ],
};

export default config;
