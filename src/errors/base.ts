export class BasePineconeError extends Error {
  constructor(message?: string) {
    super(message);

    // Set the prototype explicitly to ensure instanceof works correctly
    Object.setPrototypeOf(this, new.target.prototype);

    // Maintain a proper stack trace in V8 environments (Chrome and Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, new.target);
    }

    // set the name property
    this.name = this.constructor.name;
  }
}
