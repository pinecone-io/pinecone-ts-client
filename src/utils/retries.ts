import { BasePineconeError, mapHttpStatusError, PineconeMaxRetriesExceededError } from '../errors';

/* Retry asynchronous operations.
 *
 * @param maxRetries - The maximum number of retries to attempt.
 * @param asyncFn - The asynchronous function to retry.
 */
export class RetryOnServerFailure<T, A extends any[]> {
  maxRetries: number;
  asyncFn: (...args: A) => Promise<T>;

  constructor(asyncFn: (...args: A) => Promise<T>, maxRetries?: number) {
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

  async execute(...args: A): Promise<T> {
    console.log("Retrying!")
    console.log("maxRetries =" ,this.maxRetries)
    if (this.maxRetries < 1) {
      return this.asyncFn(...args);
    }

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      console.log("Attempt = ", attempt)
      try {
        const response = await this.asyncFn(...args);

        // Return immediately if the response is not a retryable error
        if (!this.isRetryError(response)) {
          console.log("Response is not retryable")
          return response;
        }

        // Retryable response, throw it to trigger retry logic
        console.log("Response is retryable, retrying...")
        throw response;

      } catch (error) {
        console.log("Caught retryable error")

        const mappedError = this.mapErrorIfNeeded(error);


        // If the error is not retryable, throw it immediately
        if (this.shouldStopRetrying(mappedError)) {
          console.log("Should stop retrying retryable error")
          throw mappedError;
        }

        // On the last retry, throw a MaxRetriesExceededError
        if (attempt === this.maxRetries - 1) {
          console.log("Max retries exceeded")
          throw new PineconeMaxRetriesExceededError(this.maxRetries);
        }

        // Wait before retrying
        console.log("Waiting before retrying")
        await this.delay(attempt + 1);
      }
    }

    console.log("Fell through to max retries exceeded")
    // This fallback is unnecessary, but included for type safety
    throw new PineconeMaxRetriesExceededError(this.maxRetries);
  }

  private mapErrorIfNeeded(error: any): any {
    if (error?.status) {
      return mapHttpStatusError(error);
    }
    return error; // Return original error if no mapping is needed
  }


  isRetryError(response): boolean {
    if (response) {
      if (
        response.name &&
        ['PineconeUnavailableError', 'PineconeInternalServerError'].includes(
          response.name
        )
      ) {
        return true;
      }
      if (response.status && response.status >= 500) {
        return true;
      }
    }
    return false;
  }

  // todo: write unit test for this
  private shouldStopRetrying(error: any): boolean {
    return (error.status && error.status < 500) || (error.name !== 'PineconeUnavailableError' && error.name !== 'PineconeInternalServerError');
  }

  async delay(attempt: number): Promise<void> {
    console.log("Delaying!")
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
