/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /**
   * Maximum number of total attempts (initial + retries). Defaults to 3.
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
export const isRetryableError = (error: any): boolean => {
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
export const isRetryableResponse = (response: Response): boolean => {
  return response.status >= 500;
};

/**
 * Determines if an HTTP status code indicates a retryable error.
 *
 * @param status - The HTTP status code
 * @returns true if the status code is 5xx (server error)
 */
export const isRetryableStatusCode = (status: number): boolean => {
  return status >= 500 && status < 600;
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
export const calculateRetryDelay = (
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  jitterFactor: number
): number => {
  let delayMs = baseDelay * 2 ** attempt; // Exponential backoff
  const jitter = delayMs * jitterFactor * (Math.random() - 0.5);
  delayMs += jitter;
  return Math.min(maxDelay, Math.max(0, delayMs));
};

/**
 * Simple promise-based delay utility.
 */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));
