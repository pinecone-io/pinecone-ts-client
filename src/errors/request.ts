import { BasePineconeError } from './base';
import type { ErrorContext } from '../pinecone-generated-ts-fetch/db_control';

/**
 * A request failed before the SDK received a usable response.
 * Inspect `cause` for the underlying error and check your network connection.
 *
 * @example
 * ```typescript
 * import { Errors, Pinecone } from '@pinecone-database/pinecone';
 *
 * const pc = new Pinecone();
 * try {
 *   await pc.indexes.list();
 * } catch (error) {
 *   if (error instanceof Errors.PineconeConnectionError) {
 *     console.error(error.cause);
 *   }
 *   throw error;
 * }
 * ```
 *
 * @see [Pinecone service status](https://status.pinecone.io/)
 */
export class PineconeConnectionError extends BasePineconeError {
  constructor(e: Error, url?: string) {
    let urlMessage = '';
    if (url) {
      urlMessage = ` while calling ${url}`;
    }

    super(
      `Request failed to reach Pinecone${urlMessage}. This can occur for reasons such as network problems that prevent the request from being completed, or a Pinecone API outage. Check your network connection, and visit https://status.pinecone.io/ to see whether any outages are ongoing.`,
      e,
    );
    this.name = 'PineconeConnectionError';
  }
}

/**
 * A request failed. Inspect `message` for the operation and response status, when
 * available, and `cause` for the underlying error.
 */
export class PineconeRequestError extends BasePineconeError {
  constructor(context: ErrorContext) {
    if (context.response) {
      super(
        `Request failed during a call to ${context.init.method} ${context.url} with status ${context.response.status}`,
        context.error as Error,
      );
    } else {
      super(
        `Request failed during a call to ${context.init.method} ${context.url}`,
        context.error as Error,
      );
    }
  }
}
