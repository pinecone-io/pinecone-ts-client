// const config = require('./jest.config.integration-node');
//
// module.exports = {
//   ...config,
//   testEnvironment: '@edge-runtime/jest-environment',
// };

import config from './jest.config.integration-node.js';

export default {
  ...config,
  testEnvironment: '@edge-runtime/jest-environment',
};
