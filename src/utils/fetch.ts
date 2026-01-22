import type { PineconeConfiguration } from '../data';
import {
  PineconeConfigurationError,
  PineconeMaxRetriesExceededError,
} from '../errors';
import {
  RetryConfig,
  isRetryableResponse,
  isRetryableError,
  calculateRetryDelay,
  delay,
} from './retries';

/**
 * Gets or wraps a fetch implementation with retry logic.
 *
 * This function:
 * 1. Gets the base fetch (user-provided or global)
 * 2. Wraps it with automatic retry logic for 5xx errors
 * 3. Returns the wrapped fetch for use throughout the SDK
 *
 * All requests (generated API and direct fetch) go through this wrapped fetch,
 * ensuring consistent retry behavior across the entire SDK.
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
  config: PineconeConfiguration
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
      'No global or user-provided fetch implementations found. Please supply a fetch implementation.'
    );
  }
}

/**
 * Wraps a fetch function with automatic retry logic for server errors (5xx).
 *
 * The wrapped fetch will:
 * - Retry on 5xx status codes with exponential backoff
 * - Throw PineconeMaxRetriesExceededError when retries are exhausted
 * - Pass through 2xx and 4xx responses without retrying
 *
 * @param fetchFn - The base fetch function to wrap
 * @param config - Retry configuration where `maxRetries` represents total attempts (initial + retries)
 *                 When maxRetries is 0, exactly 1 attempt is made (no retries)
 *                 When maxRetries is 1, exactly 1 attempt is made (no retries)
 *                 When maxRetries is 2, up to 2 attempts are made (1 initial + 1 retry)
 *                 When maxRetries is 3, up to 3 attempts are made (1 initial + 2 retries)
 */
function createRetryingFetch(
  fetchFn: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
  config: RetryConfig = {}
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  const maxRetries = Math.min(config.maxRetries ?? 3, 10);
  const baseDelay = config.baseDelay ?? 200;
  const maxDelay = config.maxDelay ?? 20000;
  const jitterFactor = config.jitterFactor ?? 0.25;

  return async (
    url: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> => {
    let attempt = 0; // Start at 0 for zero-indexed attempts

    // Ensure at least 1 attempt is made even when maxRetries is 0
    const totalAttempts = Math.max(maxRetries, 1);

    while (attempt < totalAttempts) {
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

        // Retryable 5xx error - check if we can retry
        if (attempt >= totalAttempts - 1) {
          throw new PineconeMaxRetriesExceededError(maxRetries);
        }

        // Wait before retrying (exponential backoff with jitter)
        await delay(
          calculateRetryDelay(attempt, baseDelay, maxDelay, jitterFactor)
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

        // Retryable error - check if we can retry
        if (attempt >= totalAttempts - 1) {
          throw new PineconeMaxRetriesExceededError(maxRetries);
        }

        // Wait before retrying
        await delay(
          calculateRetryDelay(attempt, baseDelay, maxDelay, jitterFactor)
        );

        attempt++;
      }
    }

    // Fallback (should never reach here due to logic above)
    throw new PineconeMaxRetriesExceededError(maxRetries);
  };
}
