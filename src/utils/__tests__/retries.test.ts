import { RetryOnServerFailure } from '../retries';
import {
  PineconeInternalServerError,
  PineconeMaxRetriesExceededError,
  PineconeUnavailableError,
} from '../../errors';

describe('RetryOnServerFailure', () => {
  test("Should print 'Max retries' error stmt when response fails to succeed after maxRetries is reached", async () => {
    const fakeAsyncFn: () => Promise<object> = jest
      .fn()
      .mockImplementation(() => Promise.resolve(PineconeInternalServerError));
    const retryWrapper = new RetryOnServerFailure(fakeAsyncFn, 2);
    const errorResult = async () => {
      await retryWrapper.execute();
    };
    await expect(errorResult).rejects.toThrowError(
      PineconeMaxRetriesExceededError
    );
  });

  test('Should act the same as above with PineconeUnavailableError', async () => {
    const fakeAsyncFn: () => Promise<object> = jest
      .fn()
      .mockImplementation(() => Promise.resolve(PineconeUnavailableError));
    const retryWrapper = new RetryOnServerFailure(fakeAsyncFn, 2);
    const errorResult = async () => {
      await retryWrapper.execute();
    };
    await expect(errorResult).rejects.toThrowError(
      PineconeMaxRetriesExceededError
    );
  });

  test('Should return response if successful and status code is not 5xx', async () => {
    const fakeAsyncFn: () => Promise<object> = jest
      .fn()
      .mockImplementation(() => Promise.resolve({}));
    const retryWrapper = new RetryOnServerFailure(fakeAsyncFn, 2);
    const result = await retryWrapper.execute();
    expect(result).toEqual({});
  });

  test('If maxRetries exceeds 10, throw error', async () => {
    const fakeAsyncFn: () => Promise<object> = jest
      .fn()
      .mockImplementation(() => Promise.resolve({}));
    const toThrow = async () => {
      new RetryOnServerFailure(fakeAsyncFn, 11);
    };
    await expect(toThrow()).rejects.toThrowError(
      'Max retries cannot exceed 10'
    );
  });

  test('Should retry when first encounter error, then succeed when eventually get good response back', async () => {
    // Mock the async function to fail once, then succeed
    const fakeAsyncFn: () => Promise<{ name?: string; status: number }> = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({ name: 'PineconeInternalServerError', status: 500 })
      ) // 1x failure to trigger a retry
      .mockImplementationOnce(() => Promise.resolve({ status: 200 })); // 1x success
    const retryWrapper = new RetryOnServerFailure(fakeAsyncFn, 2);
    const result = await retryWrapper.execute();
    expect(result.status).toBe(200);
  });
});

describe('calculateRetryDelay', () => {
  test('Should return a number < maxDelay', () => {
    const retryWrapper = new RetryOnServerFailure(() =>
      Promise.resolve({ PineconeUnavailableError })
    );
    const result = retryWrapper.calculateRetryDelay(3);
    expect(result).toBeLessThanOrEqual(20000);
  });

  test('Should never return a negative number', () => {
    const retryWrapper = new RetryOnServerFailure(() =>
      Promise.resolve({ PineconeUnavailableError })
    );
    const result = retryWrapper.calculateRetryDelay(3);
    expect(result).toBeGreaterThan(0);
  });
});

describe('isRetryError', () => {
  test('Should return true if response is PineconeUnavailableError', () => {
    const retryWrapper = new RetryOnServerFailure(() =>
      Promise.resolve({ name: 'PineconeUnavailableError' })
    );
    const result = retryWrapper.isRetryError({
      name: 'PineconeUnavailableError',
    });
    expect(result).toBe(true);
  });

  test('Should return false if response is not PineconeUnavailableError or PineconeInternalServerError', () => {
    const retryWrapper = new RetryOnServerFailure(() =>
      Promise.resolve({ name: 'MadeUpName' })
    );
    const result = retryWrapper.isRetryError({ name: 'MadeUpName' });
    expect(result).toBe(false);
  });

  test('Should return true if response.status >= 500', () => {
    const retryWrapper = new RetryOnServerFailure(() =>
      Promise.resolve({ status: 500 })
    );
    const result = retryWrapper.isRetryError({ status: 500 });
    expect(result).toBe(true);
  });
});
