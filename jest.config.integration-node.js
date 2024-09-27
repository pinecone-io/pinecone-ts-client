const config = require('./jest.config');

module.exports = {
  ...config,
  globalSetup: './src/integration/callSetup.js',
  reporters: [['github-actions', { silent: false }], 'default'],
  setupFilesAfterEnv: ['./utils/globalIntegrationTestSetup.ts'],
  testPathIgnorePatterns: [],
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest', // Use ts-jest for .ts files
  },
};
