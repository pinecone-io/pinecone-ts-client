import { BasePineconeError } from './base';

const CONFIG_HELP = `You can find the configuration values for your project in the Pinecone developer console at https://app.pinecone.io.`;

/**
 * The client configuration is missing a required value or contains an invalid value.
 * Read the error message for the setting to supply.
 *
 * @see {@link Pinecone} for client initialization.
 */
export class PineconeConfigurationError extends BasePineconeError {
  constructor(message: string) {
    super(`${message} ${CONFIG_HELP}`);
    this.name = 'PineconeConfigurationError';
  }
}

/**
 * Pinecone returned a response the SDK could not interpret.
 *
 * If this persists, [report the issue](https://github.com/pinecone-io/pinecone-ts-client/issues)
 * with the operation and SDK version.
 */
export class PineconeUnexpectedResponseError extends BasePineconeError {
  constructor(url: string, status: number, body: string, message?: string) {
    super(
      `Unexpected response while calling ${url}. ${
        message ? message + ' ' : ''
      }Status: ${status}. Body: ${body}`,
    );
    this.name = 'PineconeUnexpectedResponseError';
  }
}

/**
 * The runtime cannot read environment variables for client configuration.
 * Pass an explicit configuration to {@link Pinecone}.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const pc = new Pinecone({ apiKey: 'your-api-key' });
 * ```
 */
export class PineconeEnvironmentVarsNotSupportedError extends BasePineconeError {
  constructor(message: string) {
    super(message);
    this.name = 'PineconeEnvironmentVarsNotSupportedError';
  }
}

/**
 * The SDK could not determine an index host from its description.
 * Check the index in the [Pinecone console](https://app.pinecone.io) and supply its
 * host through {@link IndexOptions.host} if needed.
 */
export class PineconeUnableToResolveHostError extends BasePineconeError {
  constructor(message: string) {
    super(message);
    this.name = 'PineconeUnableToResolveHostError';
  }
}
