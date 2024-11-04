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
    const fakeAsyncFn: () => Promise<object> = jest
      .fn()
      .mockImplementationOnce(() =>
        Promise.resolve({ name: 'PineconeInternalServerError' })
      ) // 1x failure
      .mockImplementationOnce(() =>
        Promise.resolve({ status: 200, data: 'Success' })
      ); // 1x success
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
