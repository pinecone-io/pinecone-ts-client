import type { PineconeConfiguration } from '../data';
import {
  PineconeConfigurationError,
  PineconeMaxRetriesExceededError,
} from '../errors';

/**
 * Configuration for retry behavior in createRetryingFetch()
 */
export interface RetryConfig {
  /**
   * Maximum number of retries after the initial request. Defaults to 3.
   * Cannot exceed 10.
   *
   * - 0: Makes 1 attempt (initial request only, no retries)
   * - 1: Makes up to 2 attempts (1 initial + 1 retry)
   * - 3: Makes up to 4 attempts (1 initial + 3 retries)
   *
   * @example
   * ```typescript
   * // Disable retries - make only the initial request
   * const pinecone = new Pinecone({ maxRetries: 0 });
   *
   * // Allow 1 retry after initial failure (2 total attempts)
   * const pinecone = new Pinecone({ maxRetries: 1 });
   *
   * // Default: 3 retries after initial failure (4 total attempts)
   * const pinecone = new Pinecone({ maxRetries: 3 });
   * ```
   */
  maxRetries?: number;

  /**
   * Base delay in milliseconds. Defaults to 200.
   */
  baseDelay?: number;

  /**
   * Maximum delay in milliseconds. Defaults to 20000.
   */
  maxDelay?: number;

  /**
   * Jitter factor (0-1) to add randomness to retry delays. Defaults to 0.25.
   */
  jitterFactor?: number;
}

/**
 * Determines if an error is retryable.
 *
 * Retryable errors include:
 * - Server errors (5xx status codes)
 * - PineconeUnavailableError
 * - PineconeInternalServerError
 *
 * Non-retryable errors include:
 * - Client errors (4xx status codes) - these indicate a problem with the request
 * - Network errors (connection refused, etc.) - typically not transient
 *
 * @param error - The error to check
 * @returns true if the error should trigger a retry
 */
const isRetryableError = (error: any): boolean => {
  // Check error name for specific Pinecone error types
  if (error?.name) {
    if (
      ['PineconeUnavailableError', 'PineconeInternalServerError'].includes(
        error.name,
      )
    ) {
      return true;
    }
  }

  // Check status code for server errors (5xx)
  if (error?.status && error.status >= 500) {
    return true;
  }

  return false;
};

/**
 * Determines if an HTTP response indicates a retryable error.
 *
 * @param response - The HTTP response to check
 * @returns true if the response status indicates a retryable error (5xx)
 */
const isRetryableResponse = (response: Response): boolean => {
  return response.status >= 500;
};

/**
 * Calculates exponential backoff delay with jitter.
 *
 * Formula: delay = baseDelay * 2^attempt
 * - Attempt 0: ~200ms
 * - Attempt 1: ~400ms
 * - Attempt 2: ~800ms
 *
 * Jitter adds randomness (±25% by default) to prevent thundering herd issues.
 *
 * @param attempt - The retry attempt number (0-indexed)
 * @param baseDelay - Base delay in milliseconds
 * @param maxDelay - Maximum delay in milliseconds
 * @param jitterFactor - Jitter factor (0-1)
 * @returns Delay in milliseconds, capped at maxDelay
 */
const calculateRetryDelay = (
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  jitterFactor: number,
): number => {
  let delayMs = baseDelay * 2 ** attempt; // Exponential backoff
  const jitter = delayMs * jitterFactor * (Math.random() - 0.5);
  delayMs += jitter;
  return Math.min(maxDelay, Math.max(0, delayMs));
};

/**
 * Simple promise-based delay utility.
 *
 * @param ms - The number of milliseconds to delay
 * @returns A promise that resolves after the specified delay
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Gets or wraps a fetch implementation with retry logic.
 * 1. Gets the base fetch (user-provided or global)
 * 2. Wraps it with retry logic for 5xx errors
 * 3. Returns the wrapped fetch for use throughout the SDK
 */
export const getFetch = (config: PineconeConfiguration) => {
  const baseFetch = getBaseFetch(config);

  // Wrap with retry logic
  return createRetryingFetch(baseFetch, {
    maxRetries: config.maxRetries,
  });
};

/**
 * Gets the base fetch implementation without retry wrapping.
 */
function getBaseFetch(
  config: PineconeConfiguration,
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  if (config.fetchApi) {
    // User-provided fetch implementation, if any, takes precedence.
    return config.fetchApi;
  } else if (global.fetch) {
    // If a fetch implementation is present in the global scope (will work with native fetch in Node18+, Edge runtimes,
    // etc.), use that. This should prevent confusing failures in
    // Next.js projects where @vercel/fetch is mandated and
    // other implementations are stubbed out.
    return global.fetch;
  } else {
    // If no fetch implementation is found, throw an error.
    throw new PineconeConfigurationError(
      'No global or user-provided fetch implementations found. Please supply a fetch implementation.',
    );
  }
}

/**
 * Wraps a fetch function with automatic retry logic for server errors (5xx).
 *
 * The wrapped fetch function will:
 * - Retry on 5xx status codes with exponential backoff
 * - Throw PineconeMaxRetriesExceededError when retries are exhausted
 * - Pass through non-retryable responses (4xx, etc.) without retrying
 *
 * @param fetchFn - The base fetch function to wrap
 * @param config - Retry configuration where `maxRetries` represents the number of retries after the initial attempt
 *                 When maxRetries is 0, exactly 1 attempt is made (initial request, no retries)
 *                 When maxRetries is 1, up to 2 attempts are made (1 initial + 1 retry)
 *                 When maxRetries is 3, up to 4 attempts are made (1 initial + 3 retries)
 */
function createRetryingFetch(
  fetchFn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  config: RetryConfig = {},
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  const maxRetries = Math.min(config.maxRetries ?? 3, 10);
  const baseDelay = config.baseDelay ?? 200;
  const maxDelay = config.maxDelay ?? 20000;
  const jitterFactor = config.jitterFactor ?? 0.25;

  return async (
    url: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> => {
    let attempt = 1; // Start at 1 for human-readable attempt numbers

    // Total attempts = 1 initial + maxRetries
    const totalAttempts = 1 + maxRetries;

    while (attempt <= totalAttempts) {
      try {
        // Execute the fetch request
        const response = await fetchFn(url, init);

        // Success path: 2xx responses are returned immediately
        if (response.status >= 200 && response.status < 300) {
          return response;
        }

        // Non-retryable responses (4xx, etc.) - return as-is
        if (!isRetryableResponse(response)) {
          return response;
        }

        // Retryable 5xx error - check if we have retries left
        if (attempt >= totalAttempts) {
          throw new PineconeMaxRetriesExceededError(maxRetries);
        }

        // Wait before retrying (exponential backoff with jitter)
        // Use attempt - 1 for delay calculation since first retry should have baseDelay
        await delay(
          calculateRetryDelay(attempt - 1, baseDelay, maxDelay, jitterFactor),
        );

        attempt++;
      } catch (error) {
        // If it's already a PineconeMaxRetriesExceededError, re-throw
        if (error instanceof PineconeMaxRetriesExceededError) {
          throw error;
        }

        // Check if this is a retryable error
        if (!isRetryableError(error)) {
          // Not retryable - re-throw immediately
          throw error;
        }

        // Retryable error - check if we have retries left
        if (attempt >= totalAttempts) {
          throw new PineconeMaxRetriesExceededError(maxRetries);
        }

        // Wait before retrying
        // Use attempt - 1 for delay calculation since first retry should have baseDelay
        await delay(
          calculateRetryDelay(attempt - 1, baseDelay, maxDelay, jitterFactor),
        );

        attempt++;
      }
    }

    // Fallback for typescript compiler
    throw new PineconeMaxRetriesExceededError(maxRetries);
  };
}
