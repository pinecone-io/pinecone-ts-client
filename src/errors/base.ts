/**
 * Base class for errors raised by the SDK.
 * Catch this class to handle Pinecone errors together, or use a specific error class.
 *
 * @example
 * ```typescript
 * import { Errors, Pinecone } from '@pinecone-database/pinecone';
 *
 * const pc = new Pinecone();
 * try {
 *   await pc.indexes.list();
 * } catch (error) {
 *   if (error instanceof Errors.BasePineconeError) {
 *     console.error(error.message);
 *   }
 *   throw error;
 * }
 * ```
 */
export class BasePineconeError extends Error {
  /** The underlying error, if any. */
  cause?: Error;

  constructor(message?: string, cause?: Error) {
    super(message);

    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, new.target.prototype);

    // Maintain a proper stack trace in V8 environments (Chrome and Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }

    this.name = this.constructor.name;
    this.cause = cause;
  }
}
