const sharedConfig = require('../jest.config').default;

export default {
  ...sharedConfig,
  displayName: '@bahmni-frontend/app-shell',
  coverageDirectory: 'test-output/jest/coverage',
};
