import { BasePineconeError } from './base';

export type FailedRequestInfo = {
  status: number;
  url?: string;
  body?: string;
  message?: string;
};

const CONFIG_HELP = `You can find the configuration values for your project in the Pinecone developer console at https://app.pinecone.io`;

export class PineconeBadRequestError extends BasePineconeError {
  constructor(failedRequest: FailedRequestInfo) {
    const { message } = failedRequest;
    super(message);
    this.name = 'PineconeBadRequestError';
  }
}

export class PineconeAuthorizationError extends BasePineconeError {
  constructor(failedRequest: FailedRequestInfo) {
    const { url } = failedRequest;
    if (url) {
      super(
        `The API key you provided was rejected while calling ${url}. Please check your configuration values and try again. ${CONFIG_HELP}`
      );
    } else {
      super(
        `The API key you provided was rejected. Please check your configuration values and try again. ${CONFIG_HELP}`
      );
    }
    this.name = 'PineconeAuthorizationError';
  }
}

export class PineconeNotFoundError extends BasePineconeError {
  constructor(failedRequest: FailedRequestInfo) {
    const { url, message } = failedRequest;
    if (url) {
      super(
        `A call to ${url} returned HTTP status 404. ${message ? message : ''}`
      );
    } else if (message) {
      super(message);
    } else {
      super();
    }

    this.name = 'PineconeNotFoundError';
  }
}

export class PineconeInternalServerError extends BasePineconeError {
  constructor(failedRequest: FailedRequestInfo) {
    const { url, body } = failedRequest;
    const intro = url
      ? `An internal server error occured while calling the ${url} endpoint.`
      : '';
    const help = `To see overall service health and learn whether this seems like a large-scale problem or one specific to your request, please go to https://status.pinecone.io/ to view our status page. If you believe the error reflects a problem with this client, please file a bug report in the github issue tracker at https://github.com/pinecone-io/pinecone-ts-client`;
    const bodyMessage = body ? `Body: ${body}` : '';
    super([intro, help, bodyMessage].join(' ').trim());
    this.name = 'PineconeInternalServerError';
  }
}

export class PineconeNotImplementedError extends BasePineconeError {
  constructor(requestInfo: FailedRequestInfo) {
    const { url, message } = requestInfo;
    if (url) {
      super(
        `A call to ${url} returned HTTP status 501. ${message ? message : ''}`
      );
    } else if (message) {
      super(message);
    } else {
      super();
    }
    this.name = 'PineconeNotImplementedError';
  }
}

export class PineconeUnmappedHttpError extends BasePineconeError {
  constructor(failedRequest: FailedRequestInfo) {
    const { url, status, body, message } = failedRequest;
    const intro = url
      ? `An unexpected error occured while calling the ${url} endpoint. `
      : '';
    const statusMsg = status ? `Status: ${status}. ` : '';
    const bodyMsg = body ? `Body: ${body}` : '';

    super([intro, message, statusMsg, bodyMsg].join(' ').trim());
    this.name = 'PineconeUnmappedHttpError';
  }
}

export const mapHttpStatusError = (failedRequestInfo: FailedRequestInfo) => {
  switch (failedRequestInfo.status) {
    case 400:
      return new PineconeBadRequestError(failedRequestInfo);
    case 401:
      return new PineconeAuthorizationError(failedRequestInfo);
    case 404:
      return new PineconeNotFoundError(failedRequestInfo);
    case 500:
      return new PineconeInternalServerError(failedRequestInfo);
    case 501:
      return new PineconeNotImplementedError(failedRequestInfo);
    default:
      throw new PineconeUnmappedHttpError(failedRequestInfo);
  }
};
