const config = require('./jest.config');

module.exports = {
  ...config,
  testEnvironment: '@edge-runtime/jest-environment',
};
