// Config for the mocked critical-path smoke gate (src/smoke/). These tests
// mock the HTTP transport and run keyless on every PR — the TS counterpart of
// the Python SDK's `pytest tests/smoke -m mocked` gate. `--passWithNoTests` is
// intentionally NOT set, so the job fails if this suite ever collects zero
// tests (e.g. the directory is moved or emptied) rather than silently passing.
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  reporters: [
    ['github-actions', { silent: false }],
    'jest-progress-bar-reporter',
  ],
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/node_modules/'],
  testMatch: ['<rootDir>/src/smoke/**/*.test.ts'],
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
};
