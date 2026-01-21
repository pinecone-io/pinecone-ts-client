import { fetchWithRetries } from '../retries';
import {
  PineconeInternalServerError,
  PineconeMaxRetriesExceededError,
  PineconeUnavailableError,
} from '../../errors';

describe('fetchWithRetries', () => {
  const createMockResponse = (
    status: number,
    ok: boolean = status >= 200 && status < 300
  ): Response => {
    return {
      status,
      ok,
      statusText: status === 200 ? 'OK' : 'Error',
    } as Response;
  };

  describe('Successful responses', () => {
    test('Should return response immediately on 2xx status', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValue(createMockResponse(200, true));

      const response = await fetchWithRetries(
        'https://api.example.com',
        { method: 'GET' },
        { maxRetries: 3 },
        mockFetch
      );

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('Should return 201 response without retry', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValue(createMockResponse(201, true));

      const response = await fetchWithRetries(
        'https://api.example.com',
        { method: 'POST' },
        { maxRetries: 3 },
        mockFetch
      );

      expect(response.status).toBe(201);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Non-retryable errors (4xx)', () => {
    test('Should return 400 response without retry', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValue(createMockResponse(400, false));

      const response = await fetchWithRetries(
        'https://api.example.com',
        { method: 'POST' },
        { maxRetries: 3 },
        mockFetch
      );

      expect(response.status).toBe(400);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('Should return 404 response without retry', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValue(createMockResponse(404, false));

      const response = await fetchWithRetries(
        'https://api.example.com',
        { method: 'GET' },
        { maxRetries: 3 },
        mockFetch
      );

      expect(response.status).toBe(404);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Retryable errors (5xx) with success', () => {
    test('Should retry once on 503, then succeed on 200', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce(createMockResponse(503, false))
        .mockResolvedValueOnce(createMockResponse(200, true));

      const response = await fetchWithRetries(
        'https://api.example.com',
        { method: 'POST' },
        { maxRetries: 3, baseDelay: 10 }, // Use short delay for tests
        mockFetch
      );

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('Should retry twice on 500, then succeed on 200', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValueOnce(createMockResponse(500, false))
        .mockResolvedValueOnce(createMockResponse(500, false))
        .mockResolvedValueOnce(createMockResponse(200, true));

      const response = await fetchWithRetries(
        'https://api.example.com',
        { method: 'POST' },
        { maxRetries: 3, baseDelay: 10 },
        mockFetch
      );

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Retryable errors (5xx) with max retries exceeded', () => {
    test('Should throw PineconeMaxRetriesExceededError after exhausting retries', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValue(createMockResponse(503, false));

      await expect(
        fetchWithRetries(
          'https://api.example.com',
          { method: 'POST' },
          { maxRetries: 2, baseDelay: 10 },
          mockFetch
        )
      ).rejects.toThrow(PineconeMaxRetriesExceededError);

      // Should be called 3 times: 1 initial + 2 retries
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    test('Should throw PineconeMaxRetriesExceededError with maxRetries=0', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValue(createMockResponse(500, false));

      await expect(
        fetchWithRetries(
          'https://api.example.com',
          { method: 'POST' },
          { maxRetries: 0, baseDelay: 10 },
          mockFetch
        )
      ).rejects.toThrow(PineconeMaxRetriesExceededError);

      // Should be called 1 time: 1 initial attempt, 0 retries
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Retryable exceptions', () => {
    test('Should retry on PineconeUnavailableError, then succeed', async () => {
      const mockFetch = jest
        .fn()
        .mockRejectedValueOnce(
          new PineconeUnavailableError({
            status: 503,
            message: 'Service Unavailable',
            url: 'https://api.example.com',
          })
        )
        .mockResolvedValueOnce(createMockResponse(200, true));

      const response = await fetchWithRetries(
        'https://api.example.com',
        { method: 'POST' },
        { maxRetries: 3, baseDelay: 10 },
        mockFetch
      );

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('Should retry on PineconeInternalServerError, then succeed', async () => {
      const mockFetch = jest
        .fn()
        .mockRejectedValueOnce(
          new PineconeInternalServerError({
            status: 500,
            message: 'Internal Server Error',
            url: 'https://api.example.com',
          })
        )
        .mockResolvedValueOnce(createMockResponse(200, true));

      const response = await fetchWithRetries(
        'https://api.example.com',
        { method: 'POST' },
        { maxRetries: 3, baseDelay: 10 },
        mockFetch
      );

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    test('Should throw PineconeMaxRetriesExceededError after exhausting retries on exception', async () => {
      const mockFetch = jest.fn().mockRejectedValue(
        new PineconeUnavailableError({
          status: 503,
          message: 'Service Unavailable',
          url: 'https://api.example.com',
        })
      );

      await expect(
        fetchWithRetries(
          'https://api.example.com',
          { method: 'POST' },
          { maxRetries: 2, baseDelay: 10 },
          mockFetch
        )
      ).rejects.toThrow(PineconeMaxRetriesExceededError);

      // Should be called 3 times: 1 initial + 2 retries
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Non-retryable exceptions', () => {
    test('Should not retry on generic Error', async () => {
      const genericError = new Error('Network connection failed');
      const mockFetch = jest.fn().mockRejectedValue(genericError);

      await expect(
        fetchWithRetries(
          'https://api.example.com',
          { method: 'POST' },
          { maxRetries: 3, baseDelay: 10 },
          mockFetch
        )
      ).rejects.toThrow('Network connection failed');

      // Should only be called once, no retries
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('Should not retry on error with status < 500', async () => {
      const error = { status: 400, message: 'Bad Request' };
      const mockFetch = jest.fn().mockRejectedValue(error);

      await expect(
        fetchWithRetries(
          'https://api.example.com',
          { method: 'POST' },
          { maxRetries: 3, baseDelay: 10 },
          mockFetch
        )
      ).rejects.toEqual(error);

      // Should only be called once, no retries
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Configuration options', () => {
    test('Should respect custom maxRetries', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValue(createMockResponse(503, false));

      await expect(
        fetchWithRetries(
          'https://api.example.com',
          { method: 'POST' },
          { maxRetries: 5, baseDelay: 10 },
          mockFetch
        )
      ).rejects.toThrow(PineconeMaxRetriesExceededError);

      // Should be called 6 times: 1 initial + 5 retries
      expect(mockFetch).toHaveBeenCalledTimes(6);
    });

    test('Should cap maxRetries at 10', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValue(createMockResponse(503, false));

      await expect(
        fetchWithRetries(
          'https://api.example.com',
          { method: 'POST' },
          { maxRetries: 20, baseDelay: 10 }, // Request 20, but should cap at 10
          mockFetch
        )
      ).rejects.toThrow(PineconeMaxRetriesExceededError);

      // Should be called 11 times: 1 initial + 10 retries (capped)
      expect(mockFetch).toHaveBeenCalledTimes(11);
    });

    test('Should use default maxRetries of 3 when not specified', async () => {
      const mockFetch = jest
        .fn()
        .mockResolvedValue(createMockResponse(503, false));

      await expect(
        fetchWithRetries(
          'https://api.example.com',
          { method: 'POST' },
          { baseDelay: 10 }, // No maxRetries specified
          mockFetch
        )
      ).rejects.toThrow(PineconeMaxRetriesExceededError);

      // Should be called 4 times: 1 initial + 3 retries (default)
      expect(mockFetch).toHaveBeenCalledTimes(4);
    });
  });

  describe('Re-throwing PineconeMaxRetriesExceededError', () => {
    test('Should re-throw PineconeMaxRetriesExceededError without wrapping', async () => {
      const maxRetriesError = new PineconeMaxRetriesExceededError(3);
      const mockFetch = jest.fn().mockRejectedValue(maxRetriesError);

      await expect(
        fetchWithRetries(
          'https://api.example.com',
          { method: 'POST' },
          { maxRetries: 3, baseDelay: 10 },
          mockFetch
        )
      ).rejects.toThrow(PineconeMaxRetriesExceededError);

      // Should only be called once (error is already max retries)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });
});
