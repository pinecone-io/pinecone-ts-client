import { PineconeMaxRetriesExceededError } from '../errors';

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /**
   * Maximum number of retries. Defaults to 3.
   * Cannot exceed 10.
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
 * - PineconeUnavailableError (service temporarily unavailable)
 * - PineconeInternalServerError (internal service error)
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
        error.name
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
 * @param response - The HTTP response
 * @returns true if the status code is 5xx (server error)
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
 * Jitter adds randomness (±25% by default) to prevent thundering herd problem.
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
  jitterFactor: number
): number => {
  let delay = baseDelay * 2 ** attempt; // Exponential backoff
  const jitter = delay * jitterFactor * (Math.random() - 0.5);
  delay += jitter;
  return Math.min(maxDelay, Math.max(0, delay));
};

/**
 * Simple promise-based delay utility.
 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes a fetch request with automatic retry logic on server errors (5xx).
 *
 * This is the core retry function used by both:
 * 1. The retry middleware (for generated API client operations)
 * 2. Direct fetch calls (for file uploads, streaming, etc.)
 *
 * The function will:
 * - Execute the fetch request
 * - Retry on 5xx errors with exponential backoff
 * - Throw PineconeMaxRetriesExceededError when retries are exhausted
 * - Return the successful response
 *
 * @param url - The URL to fetch
 * @param init - The RequestInit options for the fetch
 * @param config - Retry configuration options
 * @param fetchFn - The fetch function to use
 * @returns The successful Response
 * @throws {PineconeMaxRetriesExceededError} When max retries are exceeded
 *
 * @example
 * ```typescript
 * // With custom fetch function
 * const response = await fetchWithRetries(url, init, { maxRetries: 5 }, customFetch);
 *
 * // With global fetch
 * const response = await fetchWithRetries(url, init, { maxRetries: 5 }, fetch);
 * ```
 */
export async function fetchWithRetries(
  url: string,
  init: RequestInit,
  config: RetryConfig,
  fetchFn: (url: string, init: RequestInit) => Promise<Response>
): Promise<Response> {
  // Normalize configuration with defaults
  const maxRetries = Math.min(config.maxRetries ?? 3, 10);
  const baseDelay = config.baseDelay ?? 200;
  const maxDelay = config.maxDelay ?? 20000;
  const jitterFactor = config.jitterFactor ?? 0.25;

  let attempt = 0;

  // Loop up to maxRetries + 1 (initial attempt + retries)
  while (attempt <= maxRetries) {
    try {
      // Execute the fetch request
      const response = await fetchFn(url, init);

      // Success path: 2xx responses are returned immediately
      if (response.status >= 200 && response.status < 300) {
        return response;
      }

      // Check if this is a retryable response (5xx error)
      if (!isRetryableResponse(response)) {
        // Not retryable (4xx, etc.), return as-is for error handling
        return response;
      }

      // Check if we've exhausted our retry budget
      if (attempt >= maxRetries) {
        throw new PineconeMaxRetriesExceededError(maxRetries);
      }

      // Wait before retrying (exponential backoff with jitter)
      await delay(
        calculateRetryDelay(attempt, baseDelay, maxDelay, jitterFactor)
      );

      // Increment attempt counter and loop to retry
      attempt++;
    } catch (error) {
      // If it's already a PineconeMaxRetriesExceededError, re-throw it
      if (error instanceof PineconeMaxRetriesExceededError) {
        throw error;
      }

      // Check if this error is retryable
      // Note: We check the error directly without mapping, as mapHttpStatusError
      // requires additional context that we don't have here. The error handling
      // middleware will map errors appropriately after retries are exhausted.
      if (!isRetryableError(error)) {
        // Not retryable, re-throw the error
        throw error;
      }

      // Check if we've exhausted our retry budget
      if (attempt >= maxRetries) {
        throw new PineconeMaxRetriesExceededError(maxRetries);
      }

      // Wait before retrying (exponential backoff with jitter)
      await delay(
        calculateRetryDelay(attempt, baseDelay, maxDelay, jitterFactor)
      );

      // Increment attempt counter and loop to retry
      attempt++;
    }
  }

  // Fallback: This should never be reached due to the logic above, but TypeScript
  // requires a return or throw here to satisfy the return type. If we somehow exit
  // the loop without returning or throwing, we've exhausted retries.
  throw new PineconeMaxRetriesExceededError(maxRetries);
}
