import { BasePineconeError } from './base';

const CONFIG_HELP = `You can find the configuration values for your project in the Pinecone developer console at https://app.pinecone.io`;

/**
 * This exception indicates there is a problem with the configuration values
 * you have provided to the client. The error message should contain additional
 * context about what you are missing.
 *
 * @see {@link Pinecone} for information about initializing the client.
 */
export class PineconeConfigurationError extends BasePineconeError {
  constructor(message: string) {
    super(`${message} ${CONFIG_HELP}`);
    this.name = 'PineconeConfigurationError';
  }
}

/**
 * This exception indicates an API call that returned a response that was
 * unable to be parsed or that did not include expected fields. It's not
 * expected to ever occur.
 *
 * If you encounter this error, please [file an issue](https://github.com/pinecone-io/pinecone-ts-client/issues) so we can investigate.
 */
export class PineconeUnexpectedResponseError extends BasePineconeError {
  constructor(url: string, status: number, body: string, message?: string) {
    super(
      `Unexpected response while calling ${url}. ${
        message ? message + ' ' : ''
      }Status: ${status}. Body: ${body}`
    );
    this.name = 'PineconeUnexpectedResponseError';
  }
}

/**
 * This error occurs when the client tries to read environment variables in
 * an environment that does not have access to the Node.js global `process.env`.
 *
 * If you are seeing this error, you will need to configure the client by passing
 * configuration values to the `Pinecone` constructor.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const pinecone = new Pinecone({
 *    apiKey: 'YOUR_API_KEY',
 * })
 * ```
 *
 * @see Instructions for configuring { @link Pinecone }
 */
export class PineconeEnvironmentVarsNotSupportedError extends BasePineconeError {
  constructor(message: string) {
    super(message);
    this.name = 'PineconeEnvironmentVarsNotSupportedError';
  }
}

/**
 * This error occurs when the client is unable to resolve the database host for a given
 * index. This is unexpected to occur unless there is a problem with the Pinecone service.
 *
 * If you encounter this error, please [file an issue](https://github.com/pinecone-io/pinecone-ts-client/issues) so we can investigate.
 */
export class PineconeUnableToResolveHostError extends BasePineconeError {
  constructor(message: string) {
    super(message);
    this.name = 'PineconeUnableToResolveHostError';
  }
}
