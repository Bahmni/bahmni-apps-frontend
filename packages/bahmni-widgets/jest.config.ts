export default {
  displayName: '@bahmni/widgets',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['./setupTests.ts'],
  transformIgnorePatterns: ['node_modules/(?!(@bahmni)/)'],
};
