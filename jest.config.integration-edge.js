const config = require('./jest.config.integration-node');

module.exports = {
  ...config,
  testEnvironment: '@edge-runtime/jest-environment',
};
