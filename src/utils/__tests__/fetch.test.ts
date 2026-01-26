import { getFetch } from '../fetch';
import {
  PineconeConfigurationError,
  PineconeMaxRetriesExceededError,
} from '../../errors';
import type { PineconeConfiguration } from '../../data';

describe('getFetch', () => {
  // Use fake timers for all retry tests to avoid real delays
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    // Reset timers and global.fetch after each test
    jest.useRealTimers();
    delete (global as any).fetch;
  });

  test('should wrap the user-provided fetch implementation if provided', async () => {
    const customFetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
    });
    const config = {
      apiKey: 'some-api-key',
      fetchApi: customFetch,
    } as PineconeConfiguration;

    const fetchFn = getFetch(config);

    // The returned function should be a wrapper, not the original
    expect(fetchFn).not.toBe(customFetch);

    // But it should call the underlying fetch
    await fetchFn('https://example.com', {});
    expect(customFetch).toHaveBeenCalledWith('https://example.com', {});
  });

  test('should wrap the global fetch implementation if user-provided fetch is not present', async () => {
    const globalFetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
    });
    (global as any).fetch = globalFetch;

    const config = {
      apiKey: 'some-api-key',
      fetchApi: undefined,
    } as PineconeConfiguration;

    const fetchFn = getFetch(config);

    // The returned function should be a wrapper, not the original
    expect(fetchFn).not.toBe(globalFetch);

    // But it should call the underlying fetch
    await fetchFn('https://example.com', {});
    expect(globalFetch).toHaveBeenCalledWith('https://example.com', {});
  });

  test('should throw a PineconeConfigurationError if no fetch implementation is found', () => {
    const config = {
      apiKey: 'some-api-key',
      fetchApi: undefined,
    } as PineconeConfiguration;

    expect(() => getFetch(config)).toThrow(PineconeConfigurationError);
    expect(() => getFetch(config)).toThrow(
      'No global or user-provided fetch implementations found. Please supply a fetch implementation.',
    );
  });

  describe('retry logic with maxRetries = 0', () => {
    test('should make exactly 1 attempt when maxRetries is 0 and request succeeds', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
        maxRetries: 0,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const response = await fetchFn('https://example.com', {});

      expect(customFetch).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test('should make exactly 1 attempt when maxRetries is 0 and request returns 5xx', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 503,
        ok: false,
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
        maxRetries: 0,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);

      await expect(fetchFn('https://example.com', {})).rejects.toThrow(
        PineconeMaxRetriesExceededError,
      );
      expect(customFetch).toHaveBeenCalledTimes(1);
    });

    test('should make exactly 1 attempt when maxRetries is 0 and request throws retryable error', async () => {
      const retryableError = new Error('Network error');
      (retryableError as any).name = 'PineconeUnavailableError';

      const customFetch = jest.fn().mockRejectedValue(retryableError);
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
        maxRetries: 0,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);

      await expect(fetchFn('https://example.com', {})).rejects.toThrow(
        PineconeMaxRetriesExceededError,
      );
      expect(customFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('retry logic with maxRetries = 1', () => {
    test('should make exactly 1 attempt when maxRetries is 1 and request succeeds', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
        maxRetries: 1,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const response = await fetchFn('https://example.com', {});

      expect(customFetch).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test('should make up to 2 attempts when maxRetries is 1 and request returns 5xx', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 503,
        ok: false,
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
        maxRetries: 1,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);

      const promise = expect(
        fetchFn('https://example.com', {}),
      ).rejects.toThrow(PineconeMaxRetriesExceededError);
      await jest.runAllTimersAsync();
      await promise;

      expect(customFetch).toHaveBeenCalledTimes(2);
    });

    test('should succeed on second attempt when maxRetries is 1 and server recovers', async () => {
      const customFetch = jest
        .fn()
        .mockResolvedValueOnce({ status: 503, ok: false })
        .mockResolvedValueOnce({ status: 200, ok: true });

      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
        maxRetries: 1,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const promise = fetchFn('https://example.com', {});
      await jest.runAllTimersAsync();
      const response = await promise;

      expect(customFetch).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
    });
  });

  describe('retry logic with default maxRetries (3)', () => {
    test('should return successful response immediately without retrying', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
        body: 'success',
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const response = await fetchFn('https://example.com', {});

      expect(customFetch).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(200);
    });

    test('should retry up to 3 times (4 total attempts) for 5xx errors and then throw', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 503,
        ok: false,
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);

      const promise = expect(
        fetchFn('https://example.com', {}),
      ).rejects.toThrow(PineconeMaxRetriesExceededError);
      await jest.runAllTimersAsync();
      await promise;

      expect(customFetch).toHaveBeenCalledTimes(4);
    });

    test('should succeed after retrying when server recovers', async () => {
      const customFetch = jest
        .fn()
        .mockResolvedValueOnce({ status: 503, ok: false })
        .mockResolvedValueOnce({ status: 503, ok: false })
        .mockResolvedValueOnce({ status: 200, ok: true });

      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const promise = fetchFn('https://example.com', {});
      await jest.runAllTimersAsync();
      const response = await promise;

      expect(customFetch).toHaveBeenCalledTimes(3);
      expect(response.status).toBe(200);
    });

    test('should not retry 4xx client errors', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 400,
        ok: false,
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const response = await fetchFn('https://example.com', {});

      expect(customFetch).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(400);
    });

    test('should not retry 404 errors', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 404,
        ok: false,
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const response = await fetchFn('https://example.com', {});

      expect(customFetch).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(404);
    });

    test('should retry on PineconeUnavailableError', async () => {
      const retryableError = new Error('Service unavailable');
      (retryableError as any).name = 'PineconeUnavailableError';

      const customFetch = jest
        .fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce({ status: 200, ok: true });

      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const promise = fetchFn('https://example.com', {});
      await jest.runAllTimersAsync();
      const response = await promise;

      expect(customFetch).toHaveBeenCalledTimes(3);
      expect(response.status).toBe(200);
    });

    test('should retry on PineconeInternalServerError', async () => {
      const retryableError = new Error('Internal server error');
      (retryableError as any).name = 'PineconeInternalServerError';

      const customFetch = jest
        .fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValueOnce({ status: 200, ok: true });

      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const promise = fetchFn('https://example.com', {});
      await jest.runAllTimersAsync();
      const response = await promise;

      expect(customFetch).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
    });

    test('should retry on error with 5xx status code', async () => {
      const error = new Error('Server error');
      (error as any).status = 500;

      const customFetch = jest
        .fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({ status: 200, ok: true });

      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const promise = fetchFn('https://example.com', {});
      await jest.runAllTimersAsync();
      const response = await promise;

      expect(customFetch).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
    });

    test('should not retry non-retryable errors', async () => {
      const nonRetryableError = new Error('Connection refused');

      const customFetch = jest.fn().mockRejectedValue(nonRetryableError);
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);

      const promise = expect(
        fetchFn('https://example.com', {}),
      ).rejects.toThrow('Connection refused');
      await jest.runAllTimersAsync();
      await promise;

      expect(customFetch).toHaveBeenCalledTimes(1);
    });

    test('should throw PineconeMaxRetriesExceededError after exhausting all retries on error', async () => {
      const retryableError = new Error('Service unavailable');
      (retryableError as any).name = 'PineconeUnavailableError';

      const customFetch = jest.fn().mockRejectedValue(retryableError);
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);

      const promise = expect(
        fetchFn('https://example.com', {}),
      ).rejects.toThrow(PineconeMaxRetriesExceededError);
      await jest.runAllTimersAsync();
      await promise;

      expect(customFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('retry logic with custom maxRetries', () => {
    test('should retry up to 2 times (3 total attempts) when maxRetries is 2', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 503,
        ok: false,
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
        maxRetries: 2,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);

      const promise = expect(
        fetchFn('https://example.com', {}),
      ).rejects.toThrow(PineconeMaxRetriesExceededError);
      await jest.runAllTimersAsync();
      await promise;

      expect(customFetch).toHaveBeenCalledTimes(3);
    });

    test('should retry up to 5 times (6 total attempts) when maxRetries is 5', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 500,
        ok: false,
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
        maxRetries: 5,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);

      const promise = expect(
        fetchFn('https://example.com', {}),
      ).rejects.toThrow(PineconeMaxRetriesExceededError);
      await jest.runAllTimersAsync();
      await promise;

      expect(customFetch).toHaveBeenCalledTimes(6);
    });

    test('should cap retries at 10 (11 total attempts) even if maxRetries is higher', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 500,
        ok: false,
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
        maxRetries: 100,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);

      const promise = expect(
        fetchFn('https://example.com', {}),
      ).rejects.toThrow(PineconeMaxRetriesExceededError);
      await jest.runAllTimersAsync();
      await promise;

      expect(customFetch).toHaveBeenCalledTimes(11);
    });
  });

  describe('retry behavior for different 5xx status codes', () => {
    test('should retry on 500 Internal Server Error', async () => {
      const customFetch = jest
        .fn()
        .mockResolvedValueOnce({ status: 500, ok: false })
        .mockResolvedValueOnce({ status: 200, ok: true });

      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const promise = fetchFn('https://example.com', {});
      await jest.runAllTimersAsync();
      const response = await promise;

      expect(customFetch).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
    });

    test('should retry on 502 Bad Gateway', async () => {
      const customFetch = jest
        .fn()
        .mockResolvedValueOnce({ status: 502, ok: false })
        .mockResolvedValueOnce({ status: 200, ok: true });

      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const promise = fetchFn('https://example.com', {});
      await jest.runAllTimersAsync();
      const response = await promise;

      expect(customFetch).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
    });

    test('should retry on 503 Service Unavailable', async () => {
      const customFetch = jest
        .fn()
        .mockResolvedValueOnce({ status: 503, ok: false })
        .mockResolvedValueOnce({ status: 200, ok: true });

      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const promise = fetchFn('https://example.com', {});
      await jest.runAllTimersAsync();
      const response = await promise;

      expect(customFetch).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
    });

    test('should retry on 504 Gateway Timeout', async () => {
      const customFetch = jest
        .fn()
        .mockResolvedValueOnce({ status: 504, ok: false })
        .mockResolvedValueOnce({ status: 200, ok: true });

      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const promise = fetchFn('https://example.com', {});
      await jest.runAllTimersAsync();
      const response = await promise;

      expect(customFetch).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
    });
  });

  describe('retry timing and exponential backoff', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    test('should use exponential backoff for retries', async () => {
      const customFetch = jest
        .fn()
        .mockResolvedValueOnce({ status: 503, ok: false })
        .mockResolvedValueOnce({ status: 503, ok: false })
        .mockResolvedValueOnce({ status: 200, ok: true });

      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const responsePromise = fetchFn('https://example.com', {});

      // First attempt happens immediately
      expect(customFetch).toHaveBeenCalledTimes(1);

      // Fast-forward through first retry delay (~200ms with jitter)
      await jest.advanceTimersByTimeAsync(300);
      expect(customFetch).toHaveBeenCalledTimes(2);

      // Fast-forward through second retry delay (~400ms with jitter)
      await jest.advanceTimersByTimeAsync(500);
      expect(customFetch).toHaveBeenCalledTimes(3);

      const response = await responsePromise;
      expect(response.status).toBe(200);
    });

    test('should apply jitter to retry delays', async () => {
      const customFetch = jest
        .fn()
        .mockResolvedValueOnce({ status: 503, ok: false })
        .mockResolvedValueOnce({ status: 200, ok: true });

      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const responsePromise = fetchFn('https://example.com', {});

      expect(customFetch).toHaveBeenCalledTimes(1);

      // The delay should be around 200ms but with jitter (±25%)
      // So it should be between 150ms and 250ms
      // Fast-forward through the delay with some buffer for jitter
      await jest.advanceTimersByTimeAsync(300);

      // Should be called by now
      expect(customFetch).toHaveBeenCalledTimes(2);

      await responsePromise;
    });
  });

  describe('edge cases', () => {
    test('should handle undefined maxRetries (use default of 3 retries = 4 total attempts)', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 503,
        ok: false,
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
        maxRetries: undefined,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);

      const promise = expect(
        fetchFn('https://example.com', {}),
      ).rejects.toThrow(PineconeMaxRetriesExceededError);
      await jest.runAllTimersAsync();
      await promise;

      // Should use default of 3 retries (4 total attempts)
      expect(customFetch).toHaveBeenCalledTimes(4);
    });

    test('should handle 2xx success responses in the range', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 201,
        ok: true,
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const response = await fetchFn('https://example.com', {});

      expect(customFetch).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(201);
    });

    test('should handle 3xx redirect responses without retrying', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 301,
        ok: false,
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const response = await fetchFn('https://example.com', {});

      expect(customFetch).toHaveBeenCalledTimes(1);
      expect(response.status).toBe(301);
    });

    test('should pass through request init options', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const requestInit = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: 'test' }),
      };

      await fetchFn('https://example.com', requestInit);

      expect(customFetch).toHaveBeenCalledWith(
        'https://example.com',
        requestInit,
      );
    });

    test('should work with URL objects', async () => {
      const customFetch = jest.fn().mockResolvedValue({
        status: 200,
        ok: true,
      });
      const config = {
        apiKey: 'some-api-key',
        fetchApi: customFetch,
      } as PineconeConfiguration;

      const fetchFn = getFetch(config);
      const url = new URL('https://example.com/api/test');

      await fetchFn(url, {});

      expect(customFetch).toHaveBeenCalledWith(url, {});
    });
  });
});
