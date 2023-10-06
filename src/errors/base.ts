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
