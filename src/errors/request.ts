import { BasePineconeError } from './base';
import type { ErrorContext } from '../pinecone-generated-ts-fetch';

/**
 * This error is thrown when the client attempts to make a
 * request and never receives any response.
 *
 * This could be due to:
 * - Incorrect configuration of the client. If the apiKey value is incorrect the request will not reach a Pinecone server.
 * - An outage of Pinecone's APIs. See [Pinecone's status page](https://status.pinecone.io/) to find out whether there is an ongoing incident.
 *
 * The `cause` property will contain a reference to the underlying error. Inspect its value to find out more about the root cause of the error.
 * ```
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const p = new Pinecone({ apiKey: 'invalid-api-key-value' })
 *
 * try {
 *  await p.listIndexes();
 * } catch (e) {
 *  console.log(e.name); // PineconeConnectionError
 *  console.log(e.cause); // Error [FetchError]: The request failed and the interceptors did not return an alternative response
 *  console.log(e.cause.cause); // TypeError: fetch failed
 *  console.log(e.cause.cause.cause); // Error: getaddrinfo ENOTFOUND controller.wrong-environment.pinecone.io
 * }
 * ```
 *
 * @see [Pinecone's status page](https://status.pinecone.io/)
 * */
export class PineconeConnectionError extends BasePineconeError {
  constructor(e: Error, url?: string) {
    let urlMessage = '';
    if (url) {
      urlMessage = ` while calling ${url}`;
    }

    super(
      `Request failed to reach Pinecone${urlMessage}. This can occur for reasons such as incorrect configuration (environment, project id, index name), network problems that prevent the request from being completed, or a Pinecone API outage. Check your client configuration, check your network connection, and visit https://status.pinecone.io/ to see whether any outages are ongoing.`,
      e
    );
    this.name = 'PineconeConnectionError';
  }
}

/**
 * This error is thrown any time a request to the Pinecone API fails.
 *
 * The `cause` property will contain a reference to the underlying error. Inspect its value to find out more about the root cause.
 */
export class PineconeRequestError extends BasePineconeError {
  constructor(context: ErrorContext) {
    if (context.response) {
      super(
        `Request failed during a call to ${context.init.method} ${context.url} with status ${context.response.status}`,
        context.error as Error
      );
    } else {
      super(
        `Request failed during a call to ${context.init.method} ${context.url}`,
        context.error as Error
      );
    }
  }
}
