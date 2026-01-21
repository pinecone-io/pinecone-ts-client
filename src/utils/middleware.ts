import {
  Middleware,
  ResponseError,
} from '../pinecone-generated-ts-fetch/db_control';
import { createRetryMiddleware } from './retryMiddleware';
import { RetryConfig } from './retries';
import { handleApiError } from '../errors';

/**
 * Creates the middleware array with debug, retry, and error handling middleware.
 *
 * Middleware execution order and responsibilities:
 *
 * 1. **Debug middleware** (if enabled) - logs requests/responses
 *
 * 2. **Retry middleware** - handles retries and error conversion:
 *    - POST hook: Detects 5xx responses and retries with exponential backoff
 *    - ON_ERROR hook: Retries 5xx errors AND converts all errors to proper types
 *      (must convert in onError because throwing exits the middleware chain)
 *
 * 3. **Error handling middleware** - converts ResponseError to proper Pinecone types:
 *    - POST hook: Converts non-2xx responses that weren't handled by retry middleware
 *    - ON_ERROR hook: Backup error conversion (rarely reached since retry middleware
 *      handles most errors in its onError hook)
 *
 * Why two middleware for errors?
 * - onError hooks: Throwing exits the chain, so retry middleware must convert errors
 * - POST hooks: Don't exit the chain, so error handling middleware can run after retry
 *
 * @param retryConfig - Configuration for retry behavior
 * @returns Array of middleware objects
 */
export const createMiddlewareArray = (
  retryConfig?: RetryConfig
): Middleware[] => {
  const debugMiddleware: Middleware[] = [];

  const chalk = (str, color) => {
    const colors = {
      blue: '\x1b[34m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
    };

    return colors[color] + str + '\x1b[39m';
  };

  /**
   * Enable the `PINECONE_DEBUG` environment variable to print the request and
   * response bodies for each request.
   *
   * Api-Key headers will be redacted.
   */
  if (
    typeof process !== 'undefined' &&
    process &&
    process.env &&
    process.env.PINECONE_DEBUG
  ) {
    const debugLogMiddleware = {
      pre: async (context) => {
        console.debug(
          chalk(`>>> Request: ${context.init.method} ${context.url}`, 'blue')
        );

        const headers = JSON.parse(JSON.stringify(context.init.headers));
        headers['Api-Key'] = '***REDACTED***';
        console.debug(chalk(`>>> Headers: ${JSON.stringify(headers)}`, 'blue'));

        if (context.init.body) {
          console.debug(chalk(`>>> Body: ${context.init.body}`, 'blue'));
        }
        console.debug('');
      },

      post: async (context) => {
        console.debug(chalk(`<<< Status: ${context.response.status}`, 'green'));
        console.debug(
          chalk(`<<< Body: ${await context.response.text()}`, 'green')
        );
        console.debug('');
      },
    };

    debugMiddleware.push(debugLogMiddleware);
  }

  /**
   * Enable the `PINECONE_DEBUG_CURL` environment variable to print the equivalent
   * curl commands for each request. These commands will include the API key and
   * other sensitive information, so be careful when using this option.
   */
  if (
    typeof process !== 'undefined' &&
    process &&
    process.env &&
    process.env.PINECONE_DEBUG_CURL
  ) {
    const debugCurlMiddleware = {
      post: async (context) => {
        let headers = `-H "Api-Key: ${
          (context.init.headers || {})['Api-Key']
        }"`;
        if (context.init.headers && context.init.headers['Content-Type']) {
          headers += ` -H "Content-Type: ${context.init.headers['Content-Type']}"`;
        }
        const cmd = `curl -X ${context.init.method} ${context.url} ${headers} ${
          context.init.body ? `-d '${context.init.body}'` : ''
        }`;
        console.debug(chalk(cmd, 'red'));
        console.debug('');
      },
    };
    debugMiddleware.push(debugCurlMiddleware);
  }

  return [
    ...debugMiddleware,
    // Retry middleware - handles retrying 5xx errors
    createRetryMiddleware(retryConfig),
    // Error handling middleware - converts ResponseErrors to proper Pinecone error types
    // This runs AFTER retry middleware, so it only sees non-retryable errors (4xx)
    // or errors that have exhausted retries
    {
      onError: async (context) => {
        // Convert any error to proper Pinecone error type
        const err = await handleApiError(context.error, undefined, context.url);
        throw err;
      },

      post: async (context) => {
        const { response } = context;

        // Success: return 2xx responses as-is
        if (response.status >= 200 && response.status < 300) {
          return response;
        }

        // Non-2xx responses: convert to proper Pinecone error
        // Note: 5xx errors should have been handled by retry middleware already,
        // so if we see them here, retries were exhausted
        const err = await handleApiError(
          new ResponseError(response, 'Response returned an error'),
          undefined,
          context.url
        );
        throw err;
      },
    },
  ];
};

// Default middleware for backward compatibility
export const middleware = createMiddlewareArray({ maxRetries: 3 });
