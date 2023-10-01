import { extractMessage } from './utils';
import { mapHttpStatusError } from './http';
import { PineconeConnectionError } from './request';
import type { ResponseError } from '../pinecone-generated-ts-fetch';

// We want to check for FetchError in a consistent way, then continue to other customizable error handling
// for all other API errors. The FetchError type arises when someone has configured the client with an invalid
// environment value; in this case no connection is ever made to a server so there's no response status code or
// body contents with information about the error.
/** @internal */
export const handleFetchError = async (
  e: unknown,
  handleResponseError: (e: ResponseError) => Promise<Error>
): Promise<Error> => {
  if (e instanceof Error && e.name === 'FetchError') {
    return new PineconeConnectionError();
  } else {
    return await handleResponseError(e as ResponseError);
  }
};

/** @internal */
export const handleApiError = async (
  e: unknown,
  customMessage?: (
    statusCode: number,
    rawMessageText: string
  ) => Promise<string>
): Promise<Error> => {
  return await handleFetchError(
    e,
    async (responseError: ResponseError): Promise<Error> => {
      const rawMessage = await extractMessage(responseError);
      const statusCode = responseError.response.status;
      const message = customMessage
        ? await customMessage(statusCode, rawMessage)
        : rawMessage;

      return mapHttpStatusError({
        status: responseError.response.status,
        url: responseError.response.url,
        message: message,
      });
    }
  );
};
