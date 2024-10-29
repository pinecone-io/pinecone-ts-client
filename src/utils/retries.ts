import { PineconeMaxRetriesExceededError } from '../errors';

/** Configuration options for retry logic */
export interface RetryOptions {
  maxRetries: number;
  delayStrategy?: string;
}

/* Retry asynchronous operations.
 *
 * @param asyncFn - The asynchronous function to retry.
 * @param options - The configuration options for retry logic.
 * */
export class RetryOnServerFailure {
  maxRetries: number;
  delayStrategy: string;
  asyncFn: (...args: any[]) => Promise<any>;

  constructor(
    asyncFn: (...args: any[]) => Promise<any>,
    options?: RetryOptions
  ) {
    if (options) {
      this.maxRetries = options.maxRetries;
      if (options.delayStrategy) {
        this.delayStrategy = options.delayStrategy;
      } else {
        this.delayStrategy = 'jitter';
      }
      if (options.maxRetries > 10) {
        throw new Error('Max retries cannot exceed 10'); // Avoid overwhelming the server
      }
    } else {
      this.maxRetries = 3;
      this.delayStrategy = 'jitter';
    }

    this.asyncFn = asyncFn;
  }

  async execute(...args: any[]): Promise<any> {
    let attempt = 0;
    while (attempt < this.maxRetries) {
      try {
        const response = await this.asyncFn(...args);
        // Check if the response is one we want to retry (500 or 503)
        if (this.isRetryError(response)) {
          // If it is, throw it, and catch it in the catch-loop
          throw response;
        }
        return response;
      } catch (error) {
        if (attempt < this.maxRetries - 1) {
          attempt += 1;
          await this.delay(attempt); // Delay before resuming while-loop
        } else {
          // If it's not a retryable error or if retries are exhausted, throw
          throw new PineconeMaxRetriesExceededError(this.maxRetries);
        }
      }
    }
  }

  isRetryError(response: any): boolean {
    return (
      response &&
      response.name &&
      ['PineconeUnavailableError', 'PineconeInternalServerError'].includes(response.name)
    );
  }

  async delay(attempt: number): Promise<void> {
    const delayTime = this.delayStrategy === 'jitter'
      ? this.jitter(attempt)
      : 1000; // 1s delay if not using 'jitter'
    return new Promise((resolve) => setTimeout(resolve, delayTime));
  }

  jitter(attempt: number): number {
    const baseDelay = 1000; // 1s
    const jitter = Math.random() * 0.5 * baseDelay; // Produces value btwn 0-0.5
    return baseDelay + jitter * attempt;
  }
}
