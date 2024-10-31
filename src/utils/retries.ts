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
    this.maxRetries = 3;
    this.delayStrategy = 'jitter';

    if (options) {
      this.maxRetries = options.maxRetries ?? this.maxRetries;
      this.delayStrategy = options.delayStrategy ?? this.delayStrategy;

      if (this.maxRetries > 10) {
        throw new Error('Max retries cannot exceed 10');
      }
    }

    this.asyncFn = asyncFn;
  }

  async execute(...args: any[]): Promise<any> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.asyncFn(...args);
        if (!this.isRetryError(response)) {
          return response; // Return if there's no retryable error
        }
        throw response; // Throw if response is retryable, caught below
      } catch (error) {
        if (attempt >= this.maxRetries) {
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
      response.status === 500 ||
      response.status === 503
    );
  }

  async delay(attempt: number): Promise<void> {
    const delayTime =
      this.delayStrategy === 'jitter' ? this.jitter(attempt) : 1000; // 1s delay if not using 'jitter'
    return new Promise((resolve) => setTimeout(resolve, delayTime));
  }

  jitter(attempt: number): number {
    const baseDelay = 1000; // 1s
    const jitter = Math.random() * 0.5 * baseDelay; // Produces value btwn 0-0.5
    return baseDelay + jitter * attempt;
  }
}
