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

describe('delayStrategy', () => {
  test('Set delay to jitter even if not provided in options', async () => {
    const retryWrapper = new RetryOnServerFailure(
      () => Promise.resolve(PineconeInternalServerError),
      5
    ); // maxRetries = 5

    jest.spyOn(retryWrapper, 'delay');
    jest.spyOn(retryWrapper, 'jitter');

    const errorResponse = async () => {
      await retryWrapper.execute();
    };

    await expect(errorResponse).rejects.toThrowError(
      PineconeMaxRetriesExceededError
    );
    expect(retryWrapper.delay).toHaveBeenCalledTimes(4); // 1st time through the retry loop does not trigger a delay
    expect(retryWrapper.jitter).toHaveBeenCalledTimes(4);
  });
});

describe('jitter', () => {
  test('Should return a number between 1000 and 2500 for attempt 3', () => {
    const retryWrapper = new RetryOnServerFailure(() =>
      Promise.resolve({ PineconeUnavailableError })
    );
    const result = retryWrapper.jitter(3);
    expect(result).toBeGreaterThanOrEqual(1000);
    expect(result).toBeLessThanOrEqual(2500);
  });
});
