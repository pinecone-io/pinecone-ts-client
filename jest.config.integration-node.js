const config = require('./jest.config');

module.exports = {
  ...config,
  reporters: [['github-actions', { silent: false }], 'default'],
  globalSetup: './src/integration/callSetup.js',
  globalTeardown: './src/integration/callTeardown.js',
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  setupFilesAfterEnv: ['./utils/globalIntegrationTestSetup.ts'],
  testPathIgnorePatterns: [],
  testEnvironment: 'node',
};
