import 'cross-fetch/polyfill';

// We want unit tests to fail if they attempt API calls without specifying mock responses
beforeEach(() => {
  jest.resetModules();
  jest.resetAllMocks();
});
