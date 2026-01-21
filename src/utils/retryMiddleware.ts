import { fetchWithRetries, RetryConfig } from './retries';

// Re-export RetryConfig for convenience
export type { RetryConfig };

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
 * Creates a middleware that automatically retries failed requests with exponential backoff.
 *
 * This middleware wraps the fetch function to use fetchWithRetries, which handles:
 * - Retrying on 5xx errors with exponential backoff
 * - Throwing PineconeMaxRetriesExceededError when retries are exhausted
 *
 * The middleware operates in the `pre` hook to intercept and wrap the fetch function
 * before any requests are made.
 *
 * @param config - Configuration options for retry behavior
 * @returns A middleware object compatible with all Pinecone API clients
 */
export const createRetryMiddleware = (
  config: RetryConfig = {}
): PineconeMiddleware => {
  const middleware: PineconeMiddleware = {
    /**
     * PRE HOOK: Called before fetch() is invoked.
     *
     * This hook wraps the fetch function to add retry logic.
     * All subsequent middleware and the actual API call will use this wrapped fetch.
     *
     * Flow:
     * 1. Store reference to original fetch function from context
     * 2. Replace context.fetch with a wrapped version that calls fetchWithRetries
     * 3. The wrapped fetch will handle all retry logic automatically
     */
    pre: async (context: RequestContext): Promise<void> => {
      const originalFetch = context.fetch;

      // Replace the fetch function with one that includes retry logic
      context.fetch = (url: string, init: RequestInit) =>
        fetchWithRetries(url, init, config, originalFetch);
    },
  };

  return middleware;
};
