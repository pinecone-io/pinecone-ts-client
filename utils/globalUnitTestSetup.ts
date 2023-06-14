// We want unit tests to fail if they attempt API calls without specifying mock responses
beforeEach(() => {
  jest.resetModules();
  jest.resetAllMocks();

  // @ts-ignore
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => {
        throw new Error('Attempted to fetch but no fetch mock was set.');
      },
    })
  );
});
