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
    let attempt = 1; // Start at 1 since this is the first attempt

    while (attempt <= maxRetries) {
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
        if (attempt > maxRetries) {
          throw new PineconeMaxRetriesExceededError(maxRetries);
        }

        // Wait before retrying (exponential backoff with jitter)
        // Use attempt - 1 for 0-indexed delay calculation
        await delay(
          calculateRetryDelay(attempt - 1, baseDelay, maxDelay, jitterFactor)
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
        if (attempt > maxRetries) {
          throw new PineconeMaxRetriesExceededError(maxRetries);
        }

        // Wait before retrying
        await delay(
          calculateRetryDelay(attempt - 1, baseDelay, maxDelay, jitterFactor)
        );

        attempt++;
      }
    }

    // Fallback (should never reach here due to logic above)
    throw new PineconeMaxRetriesExceededError(maxRetries);
  };
}
