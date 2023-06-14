import { CONFIG_HELP } from './config';

export class PineconeAuthorizationError extends Error {
  constructor(url: string) {
    super(
      `The API key you provided was rejected while calling ${url}. Please check your configuration values and try again. ${CONFIG_HELP}`
    );
    this.name = 'PineconeAuthorizationError';
  }
}

export class PineconeInternalServerError extends Error {
  constructor(url: string, body: string) {
    super(
      `An internal server error occured while calling the ${url} endpoint. To see overall service health and learn whether this seems like a large-scale problem or one specific to your request, please go to https://status.pinecone.io/ to view our status page. If you believe the error reflects a problem with this client, please file a bug report in the github issue tracker at https://github.com/pinecone-io/pinecone-ts-client. Body: ${body}`
    );
    this.name = 'PineconeInternalServerError';
  }
}

export class PineconeNotImplementedError extends Error {
  constructor(url: string, message: string = '') {
    super(`The endpoint ${url} is not yet implemented. ${message}`);
    this.name = 'PineconeNotImplementedError';
  }
}

export class PineconeUnmappedHttpError extends Error {
  constructor(url: string, status: number, body: string, message: string = '') {
    super(
      `Unexpected response while calling ${url}. ${
        message ? message + ' ' : ''
      }Status: ${status}. Body: ${body}`
    );
    this.name = 'PineconeUnmappedHttpError';
  }
}

export const mapHttpStatusError = (
  url: string,
  status: number,
  body: string,
  message?: string
) => {
  switch (status) {
    case 401:
      return new PineconeAuthorizationError(url);
    case 500:
      return new PineconeInternalServerError(url, body);
    case 501:
      return new PineconeNotImplementedError(url, message);
    default:
      throw new PineconeUnmappedHttpError(url, status, body, message);
  }
};
