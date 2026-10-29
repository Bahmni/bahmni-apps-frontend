import { esmTransformIgnorePattern } from '../../jest.esm-packages';

export default {
  displayName: '@bahmni/widgets',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['./setupTests.ts'],
  transformIgnorePatterns: [esmTransformIgnorePattern(['@bahmni', 'uuid'])],
};
