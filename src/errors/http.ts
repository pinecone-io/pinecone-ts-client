import { BasePineconeError } from './base';

/** @internal */
export type FailedRequestInfo = {
  status: number;
  url?: string;
  body?: string;
  message?: string;
};

const CONFIG_HELP = `You can find the configuration values for your project in the Pinecone developer console at https://app.pinecone.io`;

/** This error is thrown when API requests return with status 400. Typically this is due to some aspect of the request being incorrect or invalid.
 *
 * Some examples when this error could occur:
 * - While attempting to create an index with no available quota in your project.
 * - While upserting records that do not match the `dimension` of your index
 * - While attempting to create an index using an invalid name ("!@#$%")
 */
export class PineconeBadRequestError extends BasePineconeError {
  constructor(failedRequest: FailedRequestInfo) {
    const { message } = failedRequest;
    super(message);
    this.name = 'PineconeBadRequestError';
  }
}

/**
 * This error occurs when API requests are attempted using invalid configurations such as a mispelled or revoked API key.
 *
 * Log in to https://app.pinecone.io to verify you have configured the { @link Pinecone }
 * client using the correct values.
 */
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

/**
 * This error is thrown when interacting with a resource such as an index or collection
 * that cannot be found.
 */
export class PineconeNotFoundError extends BasePineconeError {
  constructor(failedRequest: FailedRequestInfo) {
    const { url } = failedRequest;
    if (url) {
      super(`A call to ${url} returned HTTP status 404.`);
    } else {
      super('The requested resource could not be found.');
    }

    this.name = 'PineconeNotFoundError';
  }
}

/**
 * This error is thrown when attempting to create a resource such as an index or
 * collection with a name that is already in use.
 * */
export class PineconeConflictError extends BasePineconeError {
  constructor(failedRequest: FailedRequestInfo) {
    const { url, message } = failedRequest;
    if (url) {
      super(
        `A call to ${url} returned HTTP status 409. ${message ? message : ''}`
      );
    } else {
      super('The resource you are attempting to create already exists.');
    }

    this.name = 'PineconeConflictError';
  }
}

/**
 * This error indicates API responses are returning with status 500 and
 * something is wrong with Pinecone. Check the [status page](https://status.pinecone.io/)
 * for information about current or recent outages.
 *
 * @see [Pinecone's status page](https://status.pinecone.io/)
 */
export class PineconeInternalServerError extends BasePineconeError {
  constructor(failedRequest: FailedRequestInfo) {
    const { url, body, status } = failedRequest;
    const intro = url
      ? `An internal server error occurred while calling the ${url} endpoint.`
      : '';
    const help = `To see overall service health and learn whether this seems like a large-scale problem or one specific to your request, please go to https://status.pinecone.io/ to view our status page. If you believe the error reflects a problem with this client, please file a bug report in the github issue tracker at https://github.com/pinecone-io/pinecone-ts-client`;
    const statusMessage = status ? `Status Code: ${status}.` : '';
    const bodyMessage = body ? `Body: ${body}` : '';
    super([intro, statusMessage, help, bodyMessage].join(' ').trim());
    this.name = 'PineconeInternalServerError';
  }
}

/* We can choose to throw this error when we want to limit requests to the server. When instantiated, pass the
 number of retries the user has made already. */
export class PineconeMaxRetriesExceededError extends BasePineconeError {
  constructor(retries: number) {
    const intro = `You have exceeded the max configured retries (${retries}). `;
    const help =
      'Increase the maxRetries field in the RetryOptions object to retry more times. If you believe the' +
      ' error reflects a problem with this client, please file a bug report in the github issue tracker at https://github.com/pinecone-io/pinecone-ts-client';
    super([intro, help].join(' ').trim());
    this.name = 'PineconeMaxRetriesExceededError';
  }
}

/**
 * This error indicates API responses are returning with status 503 and
 * Pinecone itself is down. Check the [status page](https://status.pinecone.io/)
 * for information about current or recent outages.
 *
 * The difference between this error (503) and a PineconeInternalServerError (500) is that this error does NOT indicate
 * that the server is _unable_ to process the request, just that the server will not process the request.
 *
 * @see [Pinecone's status page](https://status.pinecone.io/)
 */
export class PineconeUnavailableError extends BasePineconeError {
  constructor(failedRequest: FailedRequestInfo) {
    const { url, body, status } = failedRequest;
    const intro = url
      ? `The Pinecone service (${url}) is temporarily unavailable.`
      : '';
    const statusMessage = status ? `Status Code: ${status}.` : '';
    const help = `To see overall service health and learn whether this seems like a large-scale problem or one specific to your request, please go to https://status.pinecone.io/ to view our status page. If you believe the error reflects a problem with this client, please file a bug report in the github issue tracker at https://github.com/pinecone-io/pinecone-ts-client`;
    const bodyMessage = body ? `Body: ${body}` : '';
    super([intro, statusMessage, help, bodyMessage].join(' ').trim());
    this.name = 'PineconeUnavailableError';
  }
}

/**
 * This error is thrown when you are attempting to use a feature that is
 * not implemented or unavailable to you on your current plan. Free indexes
 * only support a subset of Pinecone's capabilities, and if you are seeing
 * these exceptions then you should consult the
 * [pricing page](https://www.pinecone.io/pricing/) to see whether upgrading
 * makes sense for your use case.
 */
export class PineconeNotImplementedError extends BasePineconeError {
  constructor(requestInfo: FailedRequestInfo) {
    const { url, message } = requestInfo;
    if (url) {
      super(
        `A call to ${url} returned HTTP status 501. ${message ? message : ''}`
      );
    } else {
      super();
    }
    this.name = 'PineconeNotImplementedError';
  }
}

/**
 * This catch-all exception is thrown when a request error that is not
 * specifically mapped to another exception is thrown.
 */
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

/** @internal */
export const mapHttpStatusError = (failedRequestInfo: FailedRequestInfo) => {
  switch (failedRequestInfo.status) {
    case 400:
      return new PineconeBadRequestError(failedRequestInfo);
    case 401:
      return new PineconeAuthorizationError(failedRequestInfo);
    case 403:
      return new PineconeBadRequestError(failedRequestInfo);
    case 404:
      return new PineconeNotFoundError(failedRequestInfo);
    case 409:
      return new PineconeConflictError(failedRequestInfo);
    case 500:
      return new PineconeInternalServerError(failedRequestInfo);
    case 501:
      return new PineconeNotImplementedError(failedRequestInfo);
    default:
      throw new PineconeUnmappedHttpError(failedRequestInfo);
  }
};
