const config = require('./jest.config');

module.exports = {
  ...config,
  globalSetup: './src/integration/callSetup.js',
  globalTeardown: './src/integration/callTeardown.js',
  reporters: [['github-actions', { silent: false }], 'default'],
  setupFilesAfterEnv: ['./utils/globalIntegrationTestSetup.ts'],
  testPathIgnorePatterns: [],
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': 'ts-jest', // Use ts-jest for .ts files
  },
};
