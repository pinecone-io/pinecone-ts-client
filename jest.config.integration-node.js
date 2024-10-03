const config = require('./jest.config');

module.exports = {
  ...config,
  reporters: [['github-actions', { silent: false }], 'default'],
  setupFilesAfterEnv: ['./utils/globalIntegrationTestSetup.ts'],
  testPathIgnorePatterns: [],
  testEnvironment: 'node',
};
