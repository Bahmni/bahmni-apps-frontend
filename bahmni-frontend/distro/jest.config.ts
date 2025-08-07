const sharedConfig = require('../jest.config').default;

export default {
  ...sharedConfig,
  displayName: 'distro/distro',
  coverageDirectory: 'test-output/jest/coverage',
};
