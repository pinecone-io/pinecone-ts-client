import { mapHttpStatusError, PineconeMaxRetriesExceededError } from '../errors';

/**
 * Context interfaces for middleware hooks.
 * These are compatible with all Pinecone generated API clients.
 */
interface RequestContext {
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  url: string;
  init: RequestInit;
}

interface ResponseContext {
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  url: string;
  init: RequestInit;
  response: Response;
}

interface ErrorContext {
  fetch: (url: string, init: RequestInit) => Promise<Response>;
  url: string;
  init: RequestInit;
  error: unknown;
  response?: Response;
}

/**
 * Middleware interface compatible with all Pinecone generated API clients.
 * Note: These types match the Middleware interface that's duplicated across all
 * generated modules (db_control, db_data, assistant_control, assistant_data,
 * inference, assistant_evaluation). See:
 *   - https://github.com/pinecone-io/pinecone-ts/blob/main/src/pinecone-generated-ts-fetch/db_control/runtime.ts
 *   - https://github.com/pinecone-io/pinecone-ts/blob/main/src/pinecone-generated-ts-fetch/assistant_control/runtime.ts
 *   - https://github.com/pinecone-io/pinecone-ts/blob/main/src/pinecone-generated-ts-fetch/db_data/runtime.ts
 *   - https://github.com/pinecone-io/pinecone-ts/blob/main/src/pinecone-generated-ts-fetch/assistant_data/runtime.ts
 *   - https://github.com/pinecone-io/pinecone-ts/blob/main/src/pinecone-generated-ts-fetch/inference/runtime.ts
 *   - https://github.com/pinecone-io/pinecone-ts/blob/main/src/pinecone-generated-ts-fetch/assistant_evaluation/runtime.ts
 */
export interface PineconeMiddleware {
  pre?(
    context: RequestContext
  ): Promise<{ url: string; init: RequestInit } | void>;
  post?(context: ResponseContext): Promise<Response | void>;
  onError?(context: ErrorContext): Promise<Response | void>;
}

/**
 * Configuration for the retry middleware
 */
export interface RetryMiddlewareConfig {
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
 * Symbol used as a property key to attach retry metadata to RequestInit objects.
 *
 * Why a Symbol?
 * - Guaranteed unique: Won't collide with other properties
 * - Hidden: Doesn't show up in Object.keys() or JSON serialization
 * - Ignored by fetch(): The native fetch API only reads known properties
 *
 * This allows us to track retry state across middleware invocations by attaching
 * metadata directly to the RequestInit object that flows through the middleware chain.
 */
const RETRY_METADATA = Symbol('pinecone.retry.metadata');

/**
 * Retry metadata tracked per request.
 * This is attached to RequestInit objects using the RETRY_METADATA symbol.
 */
interface RetryMetadata {
  /** Number of retry attempts made for this request (0 = first attempt) */
  attempt: number;
  /** Whether retries should continue (false = throw error) */
  shouldRetry: boolean;
}

/**
 * Creates a middleware that automatically retries failed requests with exponential backoff.
 *
 * This middleware will retry requests that fail with 5xx errors or specific error types
 * (PineconeUnavailableError, PineconeInternalServerError).
 *
 * The middleware operates in the `post` and `onError` hooks:
 * - In `post`: Checks for 5xx response status codes and retries
 * - In `onError`: Catches network errors and other exceptions, retries if appropriate
 *
 * @param config - Configuration options for retry behavior
 * @returns A middleware object compatible with all Pinecone API clients
 */
export const createRetryMiddleware = (
  config: RetryMiddlewareConfig = {}
): PineconeMiddleware => {
  // Normalize configuration with defaults
  const maxRetries = Math.min(config.maxRetries ?? 3, 10);
  const baseDelay = config.baseDelay ?? 200;
  const maxDelay = config.maxDelay ?? 20000;
  const jitterFactor = config.jitterFactor ?? 0.25;

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
   * @returns Delay in milliseconds, capped at maxDelay
   */
  const calculateRetryDelay = (attempt: number): number => {
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
   * Gets or initializes retry metadata for a request.
   *
   * This function attaches metadata to the RequestInit object using a Symbol key.
   * On first call, it initializes the metadata. On subsequent calls (during retries),
   * it retrieves the existing metadata.
   *
   * @param init - The RequestInit object that flows through middleware
   * @returns The retry metadata for this request
   */
  const getRetryMetadata = (init: RequestInit): RetryMetadata => {
    if (!init[RETRY_METADATA]) {
      init[RETRY_METADATA] = { attempt: 0, shouldRetry: true };
    }
    return init[RETRY_METADATA];
  };

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

  const middleware: PineconeMiddleware = {
    /**
     * POST HOOK: Called after fetch() completes successfully with a response.
     *
     * This hook handles retries for server errors (5xx status codes).
     * It checks the response status and retries if appropriate.
     *
     * Flow:
     * 1. Check if response is successful (2xx) → return it
     * 2. Check if response is retryable (5xx) → retry
     * 3. Check retry limits → give up or retry
     * 4. Wait with exponential backoff → retry
     */
    post: async (context: ResponseContext): Promise<Response | void> => {
      const { response, init, fetch, url } = context;
      const metadata = getRetryMetadata(init);

      // Success path: 2xx responses are returned immediately
      if (response.status >= 200 && response.status < 300) {
        return response;
      }

      // Check if this response should trigger a retry
      // (5xx errors only; 4xx errors are passed through)
      if (!isRetryableResponse(response) || !metadata.shouldRetry) {
        return response; // Let error handling middleware process it
      }

      // Check if we've exhausted our retry budget
      if (metadata.attempt >= maxRetries) {
        // Mark as no longer retryable and pass through to error handlers
        metadata.shouldRetry = false;
        return response;
      }

      // Increment retry counter
      metadata.attempt += 1;

      // Wait before retrying (exponential backoff with jitter)
      await delay(calculateRetryDelay(metadata.attempt - 1));

      // Retry the request by calling fetch with the same parameters
      // This will re-enter the middleware chain from the beginning
      const retryResponse = await fetch(url, init);
      return retryResponse;
    },

    /**
     * ERROR HOOK: Called when fetch() throws an exception.
     *
     * This hook handles retries for network errors and exceptions.
     * It checks if the error is retryable and retries if appropriate.
     *
     * Flow:
     * 1. Map error to Pinecone error types
     * 2. Check if error is retryable → abort if not
     * 3. Check retry limits → throw if exhausted
     * 4. Wait with exponential backoff → retry
     */
    onError: async (context: ErrorContext): Promise<Response | void> => {
      const { error, init, fetch, url } = context;
      const metadata = getRetryMetadata(init);

      // Map raw errors to Pinecone error types (if they have a status code)
      // This allows us to check error names and status codes consistently
      const mappedError =
        typeof error === 'object' && error !== null && 'status' in error
          ? mapHttpStatusError(error as any)
          : error;

      // Check if this error should trigger a retry
      if (!isRetryableError(mappedError) || !metadata.shouldRetry) {
        // Not retryable, let other middleware handle it
        // (returning undefined lets the error propagate)
        return;
      }

      // Check if we've exhausted our retry budget
      if (metadata.attempt >= maxRetries) {
        // Mark as no longer retryable and throw specific error
        metadata.shouldRetry = false;
        throw new PineconeMaxRetriesExceededError(maxRetries);
      }

      // Increment retry counter
      metadata.attempt += 1;

      // Wait before retrying (exponential backoff with jitter)
      await delay(calculateRetryDelay(metadata.attempt - 1));

      // Retry the request by calling fetch with the same parameters
      // This will re-enter the middleware chain from the beginning
      // If it fails again, this onError hook will be called again
      const retryResponse = await fetch(url, init);
      return retryResponse;
    },
  };

  return middleware;
};
