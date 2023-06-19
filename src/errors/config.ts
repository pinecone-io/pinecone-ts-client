import { BasePineconeError } from './base';

const CONFIG_HELP = `You can find the configuration values for your project in the Pinecone developer console at https://app.pinecone.io`;

export class PineconeConfigurationError extends BasePineconeError {
  constructor(message: string) {
    super(`${message} ${CONFIG_HELP}`);
    this.name = 'PineconeConfigurationError';
  }
}

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

export class PineconeEnvironmentVarsNotSupportedError extends BasePineconeError {
  constructor(message: string) {
    super(message);
    this.name = 'PineconeEnvironmentVarsNotSupportedError';
  }
}

export class PineconeUnknownRequestFailure extends BasePineconeError {
  constructor(url: string, underlyingError: Error) {
    const message = `Something went wrong while attempting to call ${url}. Please check your configuration and try again later. Underlying error was ${JSON.stringify(
      underlyingError
    )}`;
    super(message);
    this.name = 'PineconeUnknownRequestFailure';
  }
}
