/*
Retry Trigger: Retry logic is typically triggered by specific HTTP error responses, such as 500 (Internal Server
 Error), 503 (Service Unavailable), or network-related errors like timeouts.

Retry Limit: It includes setting a maximum number of retry attempts to prevent infinite loops.

Delay Strategy: The logic often incorporates a delay between retries, which can be constant, incremental, or
 exponential, to avoid overwhelming the server or network.
----

Categorizing Error Responses: Not all HTTP error codes are suitable for retries. It's essential to differentiate
 between client-side errors (4xx codes) and server-side errors (5xx codes).

When to Retry: Generally, retry logic should target server-side errors like 500 (Internal Server Error) or 503
 (Service Unavailable), as they often indicate temporary issues. Client-side errors like 404 (Not Found) or 400 (Bad
  Request) usually signify issues that retries won't resolve.

Customizing Logic: Tailor the retry logic based on the type of error code received, and consider handling certain
 error codes (like 429 - Too Many Requests) with specific strategies, such as exponential backoff.

---
Find out our API rate limits
*/

/*
upsert

create an index
delete an index
configure an index

embed
*/

// 500 (Internal Server Error) --> PineconeInternalServerError
// 503 (Service Unavailable) --> PineconeUnavailableError

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
  retryCount: number = 0

  constructor(
    asyncFn: (...args: any[]) => Promise<any>,
    options?: RetryOptions
  ) {
    if (options) {
      this.maxRetries = options.maxRetries;
      if (options.delayStrategy) {
        this.delayStrategy = options.delayStrategy
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
    this.retryCount = 0;
  }

  // Main retry logic
  async execute(...args: any[]): Promise<any> {
    let attempt = 0;
    while (attempt <= this.maxRetries) {
      const response = await this.asyncFn(...args);
      // Check if the response is server-side error (500, 503)
      if (
        response &&
        response.name &&
        ['PineconeUnavailableError', 'PineconeInternalServerError'].includes(
          response.name
        )
      ) {
        attempt += 1;
        this.retryCount += 1;
        // If retries are exhausted, return the response as-is
        if (attempt >= this.maxRetries) {
          return 'Max retries exceeded: ' + response;
        }
        // Wait for the delay before retrying
        await this.delay(attempt);
      } else {
        // Return the result if successful and the status code is not 5xx
        return response;
      }
    }
  }

  async delay(attempt: number): Promise<void> {
    let delayTime = 0;
    if (this.delayStrategy && this.delayStrategy === 'jitter') {
      delayTime = this.jitter(attempt);
    } else {
      delayTime = 1000;
    }
    // Wait for the specified delay time
    return new Promise((resolve) => setTimeout(resolve, delayTime));
  }

  jitter(attempt: number): number {
    const baseDelay = 1000; // 1s
    const jitter = Math.random() * 0.5 * baseDelay; // produces value between 0 and 0.5
    return baseDelay + jitter * attempt;
  }
}
