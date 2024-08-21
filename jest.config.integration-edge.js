import config from './jest.config.integration-node.js';

export default {
  ...config,
  testEnvironment: '@edge-runtime/jest-environment',
};
