import { RetryOnServerFailure, RetryOptions } from '../retries';
import { PineconeInternalServerError, PineconeUnavailableError } from '../../errors';

describe('RetryOnServerFailure', () => {
  test('If no options are provided, maxRetries and delay=jitter should be auto-set', async () => {
    const fakeAsyncFn: () => Promise<object> = jest
      .fn()
      .mockImplementation(() => Promise.resolve(PineconeInternalServerError)
      );
    const retryWrapper = new RetryOnServerFailure(fakeAsyncFn);
    jest.spyOn(retryWrapper, 'delay');
    jest.spyOn(retryWrapper, 'jitter');
    await retryWrapper.execute();
    expect(retryWrapper.delay).toHaveBeenCalledTimes(2); // w/o options obj, default maxRetries = 3
    expect(retryWrapper.jitter).toHaveBeenCalledTimes(2); // w/o options obj, default delayStrategy = 'jitter'
  });

  test('Should print \'Max retries\' error stmt when response fails to succeed after maxRetries is reached', async () => {
    const fakeAsyncFn: () => Promise<object> = jest
      .fn()
      .mockImplementation(() => Promise.resolve(PineconeInternalServerError)
      );
    const retryWrapper = new RetryOnServerFailure(fakeAsyncFn, { maxRetries: 2 });
    const result: PineconeInternalServerError = await retryWrapper.execute();
    expect(result).toBe('Max retries exceeded: ' + PineconeInternalServerError);
  });

  test('Should act the same as above with PineconeUnavailableError', async () => {
    const fakeAsyncFn: () => Promise<object> = jest
      .fn()
      .mockImplementation(() => Promise.resolve(PineconeUnavailableError));
    const retryWrapper = new RetryOnServerFailure(fakeAsyncFn, { maxRetries: 2 });
    const result = await retryWrapper.execute();
    expect(result).toBe('Max retries exceeded: ' + PineconeUnavailableError);
  });

  test('Should return response if successful and status code is not 5xx', async () => {
    const fakeAsyncFn: () => Promise<object> = jest
      .fn()
      .mockImplementation(() => Promise.resolve({}));
    const retryWrapper = new RetryOnServerFailure(fakeAsyncFn, { maxRetries: 2 });
    const result = await retryWrapper.execute();
    expect(result).toEqual({});
  });

  test('If maxRetries exceeds 10, throw error', async () => {
    const fakeAsyncFn: () => Promise<object> = jest
      .fn()
      .mockImplementation(() => Promise.resolve({}));
    const toThrow = async () => {
      new RetryOnServerFailure(fakeAsyncFn, { maxRetries: 11 } as RetryOptions);
    };
    await expect(toThrow()).rejects.toThrowError('Max retries cannot exceed 10');
  });

  test('Should retry when first encounter error, then succeed when eventually get good response back', async () => {
    const fakeAsyncFn: () => Promise<object> = jest
      .fn()
      .mockImplementationOnce(() => Promise.resolve({ name: 'PineconeInternalServerError' })) // 1x failure
      .mockImplementationOnce(() => Promise.resolve({ status: 200, data: 'Success' })); // 1x success
    const retryWrapper = new RetryOnServerFailure(fakeAsyncFn, { maxRetries: 2 });
    const result = await retryWrapper.execute();
    expect(result.status).toBe(200);
  });
});

describe('delayStrategy', () => {
  test('Set delay even if not provided in options', async () => {
    const retryOptions = { maxRetries: 5 } as RetryOptions;
    const retryWrapper = new RetryOnServerFailure(() => Promise.resolve(PineconeInternalServerError), retryOptions);
    jest.spyOn(retryWrapper, 'delay');
    jest.spyOn(retryWrapper, 'jitter');
    await retryWrapper.execute();
    expect(retryWrapper.delay).toHaveBeenCalledTimes(4);
    expect(retryWrapper.jitter).toHaveBeenCalledTimes(4); // Should default to jitter w/o delayStrategy needing to
    // be set
  });

  test('When delayStrategy is set to \'fixed\', \'jitter\' should not be called', async () => {
    const retryOptions = { maxRetries: 5, delayStrategy: 'fixed' } as RetryOptions;
    const retryWrapper = new RetryOnServerFailure(() => Promise.resolve(PineconeInternalServerError), retryOptions);
    jest.spyOn(retryWrapper, 'delay');
    jest.spyOn(retryWrapper, 'jitter');
    await retryWrapper.execute();
    expect(retryWrapper.delay).toHaveBeenCalledTimes(4);
    expect(retryWrapper.jitter).toHaveBeenCalledTimes(0);
  });

});

describe('jitter', () => {
  test('Should return a number between 1000 and 2500 for attempt 3', () => {
    const retryWrapper = new RetryOnServerFailure(() => Promise.resolve({ PineconeUnavailableError }));
    const result = retryWrapper.jitter(3);
    expect(result).toBeGreaterThanOrEqual(1000);
    expect(result).toBeLessThanOrEqual(2500);
  });
});
