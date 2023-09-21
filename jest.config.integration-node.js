const config = require('./jest.config');

module.exports = {
  ...config,
  setupFilesAfterEnv: ['./utils/globalIntegrationTestSetup.ts'],
  testPathIgnorePatterns: [],
  testEnvironment: 'node',
};
