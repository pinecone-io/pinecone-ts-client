const config = require('./jest.config.integration-node');

module.exports = {
  ...config,
  testEnvironment: './src/integration/custom-jest-environment-edge.ts',
};
