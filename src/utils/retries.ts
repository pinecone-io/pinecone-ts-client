import { PineconeMaxRetriesExceededError } from '../errors';

/* Retry asynchronous operations.
 *
 * @param asyncFn - The asynchronous function to retry.
 * @param maxRetries - The maximum number of retries to attempt.
 * */
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
        throw response; // Throw if response is retryable, caught below
      } catch (error) {
        if (attempt === this.maxRetries - 1) {
          throw new PineconeMaxRetriesExceededError(this.maxRetries);
        }
        await this.delay(attempt + 1); // Increment before passing to `delay`
      }
    }
  }

  isRetryError(response: any): boolean {
    return (
      (response &&
        response.name &&
        ['PineconeUnavailableError', 'PineconeInternalServerError'].includes(
          response.name
        )) ||
      response.status >= 500
    );
  }

  async delay(attempt: number): Promise<void> {
    const delayTime = this.calculateRetryDelay(attempt);
    return new Promise((resolve) => setTimeout(resolve, delayTime));
  }

  /*
  * Calculate the delay time for retrying an operation.
  *
  * @param attempt: The # of times the operation has been attempted.
  * @param baseDelay: The base delay time in milliseconds (default 200ms).
  * @param maxDelay: The maximum delay time in milliseconds (default 20s).
  * @param jitterFactor: Controls how large the jitter can be relative to the delay.
  */
  calculateRetryDelay = (attempt: number, baseDelay = 200, maxDelay = 20000, jitterFactor = 0.25) => {
    let delay = baseDelay * (2 ** attempt); // Delay = exponential backoff (baseDelay * 2^attempt)

    // Apply jitter as a random percentage of the original delay; e.g.: if `jitterFactor` = 0.25 and `baseDelay` = 1000,
    // then `jitter` is 25% of `baseDelay`)
    const jitter = delay * jitterFactor * (Math.random() - 0.5);
    delay += jitter;

    // Ensure delay is not negative or greater than maxDelay
    return Math.min(maxDelay, Math.max(0, delay));
  };

}
