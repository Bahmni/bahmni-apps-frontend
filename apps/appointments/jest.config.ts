export default {
  displayName: '@bahmni/appointments-app',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(@bahmni/design-system|@bahmni/services)/)',
  ],
  moduleNameMapper: {
    '^i18next$': '<rootDir>/../../node_modules/i18next',
    '^react-i18next$': '<rootDir>/../../node_modules/react-i18next',
    '\\.(css|scss)$': 'identity-obj-proxy',
  },
};
