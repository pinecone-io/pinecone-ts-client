import { withoutContentType } from './additionalHeaders';
import {
  HTTPHeaders,
  Middleware,
  ResponseError,
} from '../pinecone-generated-ts-fetch/db_control';
import { handleApiError, PineconeMaxRetriesExceededError } from '../errors';
import { assertRequestPathIsAddressable } from './requestPath';

const toHeaderRecord = (existing: RequestInit['headers']): HTTPHeaders => {
  if (!existing) {
    return {};
  }
  if (Array.isArray(existing)) {
    return Object.fromEntries(existing);
  }
  if (typeof Headers !== 'undefined' && existing instanceof Headers) {
    const record: HTTPHeaders = {};
    existing.forEach((value, name) => {
      record[name] = value;
    });
    return record;
  }
  return { ...(existing as HTTPHeaders) };
};

const mergeHeaders = (
  existing: RequestInit['headers'],
  additionalHeaders: HTTPHeaders,
): HTTPHeaders => {
  const base = toHeaderRecord(existing);
  return { ...base, ...withoutContentType(additionalHeaders) };
};

const additionalHeadersMiddleware = (
  additionalHeaders: HTTPHeaders,
): Middleware => ({
  pre: async ({ url, init }) => ({
    url,
    init: { ...init, headers: mergeHeaders(init.headers, additionalHeaders) },
  }),
});

/**
 * Creates middleware for path safety, header precedence, debug, and error handling.
 *
 * Middleware execution order:
 * 1. Path safety - rejects a request that would resolve to a different route
 * 2. Additional-headers middleware (if any) - applies configured headers last
 * 3. Debug middleware (if enabled) - logs requests/responses
 * 4. Error handling middleware - converts ResponseError to proper Pinecone error types
 *
 * @param additionalHeaders - Headers configured on the client, applied after a generated
 * operation's own headers. Matching is case-sensitive, so an entry keyed exactly
 * `X-Pinecone-Api-Version` takes precedence over the SDK's pinned version. `Content-Type`
 * is the one exception: the body is already encoded by the time these are applied, so the
 * operation's own value stands regardless of the caller's header casing.
 * @returns Array of middleware objects
 */
export const createMiddlewareArray = (
  additionalHeaders?: HTTPHeaders | null,
): Middleware[] => {
  const headerMiddleware: Middleware[] =
    additionalHeaders && Object.keys(additionalHeaders).length > 0
      ? [additionalHeadersMiddleware({ ...additionalHeaders })]
      : [];
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
          chalk(`>>> Request: ${context.init.method} ${context.url}`, 'blue'),
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
          chalk(`<<< Body: ${await context.response.text()}`, 'green'),
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
    {
      pre: async (context) => {
        assertRequestPathIsAddressable(context.url);
      },
    },
    ...headerMiddleware,
    ...debugMiddleware,
    // Error handling middleware - converts ResponseErrors to proper Pinecone error types
    {
      onError: async (context) => {
        // Pass through PineconeMaxRetriesExceededError without conversion
        if (context.error instanceof PineconeMaxRetriesExceededError) {
          throw context.error;
        }

        // Convert any other error to proper Pinecone error type
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
        const err = await handleApiError(
          new ResponseError(response, 'Response returned an error'),
          undefined,
          context.url,
        );
        throw err;
      },
    },
  ];
};
