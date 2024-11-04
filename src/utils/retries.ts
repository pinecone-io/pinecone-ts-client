import { PineconeMaxRetriesExceededError } from '../errors';

/* Retry asynchronous operations.
 *
 * @param maxRetries - The maximum number of retries to attempt.
 *  * @param asyncFn - The asynchronous function to retry.
 */
export class RetryOnServerFailure {
  maxRetries: number;
  asyncFn: (...args: any[]) => Promise<any>;

  constructor(asyncFn: (...args: any[]) => Promise<any>, maxRetries?: number) {
    if (maxRetries) {
      this.maxRetries = maxRetries;
    } else {
      this.maxRetries = 3;
    }

    if (this.maxRetries > 10) {
      throw new Error('Max retries cannot exceed 10');
    }

    this.asyncFn = asyncFn;
  }

  async execute(...args: any[]): Promise<any> {
    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await this.asyncFn(...args);
        if (!this.isRetryError(response)) {
          return response; // Return if there's no retryable error
        }
        throw response; // Throw if response is retryable, and catch below
      } catch (error) {
        if (attempt === this.maxRetries - 1) {
          throw new PineconeMaxRetriesExceededError(this.maxRetries);
        }
        await this.delay(attempt + 1); // Increment before passing to `delay`
      }
    }
  }

  isRetryError(response: any): boolean {
    if (response) {
      if (
        response.name &&
        ['PineconeUnavailableError', 'PineconeInternalServerError'].includes(
          response.name
        )
      ) {
        return true;
      }
      if (response.status >= 500) {
        return true;
      }
    }
    return false;
  }

  async delay(attempt: number): Promise<void> {
    const delayTime = this.calculateRetryDelay(attempt);
    return new Promise((resolve) => setTimeout(resolve, delayTime));
  }

  /*
   * Calculate the delay time for retrying an operation.
   *
   * @param attempt: The # of times the operation has been attempted.
   * @param baseDelay: The base delay time in milliseconds.
   * @param maxDelay: The maximum delay time in milliseconds.
   * @param jitterFactor: The magnitude of jitter relative to the delay.
   */
  calculateRetryDelay = (
    attempt: number,
    baseDelay = 200,
    maxDelay = 20000,
    jitterFactor = 0.25
  ) => {
    let delay = baseDelay * 2 ** attempt; // Exponential (baseDelay * 2^attempt)

    // Apply jitter as a random percentage of the original delay; e.g.: if `jitterFactor` = 0.25 and `baseDelay` = 1000,
    // then `jitter` is 25% of `baseDelay`
    const jitter = delay * jitterFactor * (Math.random() - 0.5);
    delay += jitter;

    // Ensure delay is not negative or greater than maxDelay
    return Math.min(maxDelay, Math.max(0, delay));
  };
}
