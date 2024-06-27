import { extractMessage } from './utils';
import { mapHttpStatusError } from './http';
import { PineconeConnectionError } from './request';
import type { ResponseError } from '../pinecone-generated-ts-fetch/control';

/** @internal */
export const handleApiError = async (
  e: unknown,
  customMessage?: (
    statusCode: number,
    rawMessageText: string
  ) => Promise<string>,
  url?: string
): Promise<Error> => {
  if (e instanceof Error && e.name === 'ResponseError') {
    const responseError = e as ResponseError;
    const rawMessage = await extractMessage(responseError);
    const statusCode = responseError.response.status;
    const message = customMessage
      ? await customMessage(statusCode, rawMessage)
      : rawMessage;

    return mapHttpStatusError({
      status: responseError.response.status,
      url: responseError.response.url || url,
      message: message,
    });
  } else if (e instanceof PineconeConnectionError) {
    // If we've already wrapped this error, just return it
    return e;
  } else {
    // There seem to be some situations where "e instanceof Error" is erroneously
    // false (perhaps the custom errors emitted by cross-fetch do not extend Error?)
    // but we can still cast it to an Error type because all we're going to do
    // with it is store off a reference to whatever it is under the "cause"
    const err = e as Error;
    return new PineconeConnectionError(err);
  }
};
