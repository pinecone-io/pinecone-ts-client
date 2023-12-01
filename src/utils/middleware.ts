import { Middleware, ResponseError } from '../pinecone-generated-ts-fetch';
import { handleApiError } from '../errors';

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
      let headers = `-H "Api-Key: ${(context.init.headers || {})['Api-Key']}"`;
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

export const middleware = [
  ...debugMiddleware,
  {
    onError: async (context) => {
      const err = await handleApiError(context.error, undefined, context.url);
      throw err;
    },

    post: async (context) => {
      const { response } = context;

      if (response.status >= 200 && response.status < 300) {
        return response;
      } else {
        const err = await handleApiError(
          new ResponseError(response, 'Response returned an error'),
          undefined,
          context.url
        );
        throw err;
      }
    },
  },
];
