import { RetryConfig } from './retries';
import { PineconeMaxRetriesExceededError, handleApiError } from '../errors';

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
 * Helper functions
 */
function isRetryableStatusCode(status: number): boolean {
  return status >= 500 && status < 600;
}

function calculateRetryDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
  jitterFactor: number
): number {
  const exponentialDelay = baseDelay * Math.pow(2, attempt);
  const jitter = exponentialDelay * jitterFactor * (Math.random() * 2 - 1);
  return Math.min(exponentialDelay + jitter, maxDelay);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Symbol to store retry state on RequestInit
const RETRY_STATE = Symbol('retryState');

interface RetryState {
  attempt: number;
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  jitterFactor: number;
}

/**
 * Creates retry middleware for handling automatic retries of failed requests.
 *
 * This middleware handles both retry logic AND error conversion:
 *
 * 1. **PRE hook**: Attaches retry metadata to each request
 * 2. **POST hook**: Detects 5xx responses and retries with exponential backoff
 * 3. **ON_ERROR hook**: Handles errors thrown during fetch:
 *    - Retries 5xx errors with exponential backoff
 *    - Throws PineconeMaxRetriesExceededError when retries are exhausted
 *    - Converts all other errors to proper Pinecone types (via handleApiError)
 *
 * Note: The onError hook must convert errors because throwing in onError exits
 * the middleware chain immediately, preventing subsequent middleware from running.
 * The error handling middleware is only needed for POST hook error conversion.
 *
 * @param config - Configuration options for retry behavior
 * @returns A middleware object compatible with all Pinecone API clients
 */
export const createRetryMiddleware = (
  config: RetryConfig = {}
): PineconeMiddleware => {
  const maxRetries = Math.min(config.maxRetries ?? 3, 10);
  const baseDelay = config.baseDelay ?? 200;
  const maxDelay = config.maxDelay ?? 20000;
  const jitterFactor = config.jitterFactor ?? 0.25;

  return {
    /**
     * PRE HOOK: Initialize retry state for this request (if not already present)
     */
    pre: async (context: RequestContext): Promise<void> => {
      // Check if retry state already exists (e.g., from a retry attempt)
      const existingState = (context.init as any)[RETRY_STATE] as
        | RetryState
        | undefined;

      // Only create new state if it doesn't exist
      if (!existingState) {
        const state: RetryState = {
          attempt: 0,
          maxRetries,
          baseDelay,
          maxDelay,
          jitterFactor,
        };
        (context.init as any)[RETRY_STATE] = state;
      }
    },

    /**
     * POST HOOK: Check for retryable responses and retry if needed
     * This runs after a successful fetch (no exception thrown)
     */
    post: async (context: ResponseContext): Promise<Response> => {
      const { response } = context;
      const state = (context.init as any)[RETRY_STATE] as
        | RetryState
        | undefined;

      // If no state, just return the response
      if (!state) {
        return response;
      }

      // Success: return 2xx responses as-is
      if (response.status >= 200 && response.status < 300) {
        return response;
      }

      // Check if this is a retryable 5xx error
      if (!isRetryableStatusCode(response.status)) {
        // Not retryable (4xx, etc.) - let it pass through
        // The generated code will throw ResponseError for this
        return response;
      }

      // Retryable 5xx error
      // Check if we've exhausted retries (attempt is 0-indexed, maxRetries is total attempts)
      // E.g., with maxRetries=3: attempts 0, 1, 2 are allowed. After attempt 2, we check if attempt+1 >= 3
      if (state.attempt + 1 >= state.maxRetries) {
        // Exhausted retries - throw PineconeMaxRetriesExceededError
        throw new PineconeMaxRetriesExceededError(state.maxRetries);
      }

      // Retry: Wait with exponential backoff
      await delay(
        calculateRetryDelay(
          state.attempt,
          state.baseDelay,
          state.maxDelay,
          state.jitterFactor
        )
      );

      // Increment attempt counter
      state.attempt++;

      // Make the retry request
      // Note: This will go through middleware again (including this post hook)
      const retryResponse = await context.fetch(context.url, context.init);
      return retryResponse;
    },

    /**
     * ON_ERROR HOOK: Handle errors thrown during fetch and retry if appropriate
     *
     * Note: When an onError hook throws, it exits the middleware chain immediately,
     * so we must convert errors to proper Pinecone types here before throwing.
     */
    onError: async (context: ErrorContext): Promise<Response | void> => {
      const state = (context.init as any)[RETRY_STATE] as
        | RetryState
        | undefined;

      // If no state, convert error and re-throw
      if (!state) {
        const err = await handleApiError(context.error, undefined, context.url);
        throw err;
      }

      // If we have a response and it's a 5xx error, handle it like the post hook
      if (context.response && isRetryableStatusCode(context.response.status)) {
        // Check if we've exhausted retries
        if (state.attempt + 1 >= state.maxRetries) {
          // Exhausted retries - throw PineconeMaxRetriesExceededError
          throw new PineconeMaxRetriesExceededError(state.maxRetries);
        }

        // Retry
        await delay(
          calculateRetryDelay(
            state.attempt,
            state.baseDelay,
            state.maxDelay,
            state.jitterFactor
          )
        );

        state.attempt++;
        const retryResponse = await context.fetch(context.url, context.init);
        return retryResponse;
      }

      // Non-retryable error - convert to proper Pinecone error type and throw
      const err = await handleApiError(context.error, undefined, context.url);
      throw err;
    },
  };
};
