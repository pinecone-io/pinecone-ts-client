import {
  mapHttpStatusError,
  PineconeConnectionError,
  extractMessage,
} from '../../errors';
import type { ResponseError } from '../../pinecone-generated-ts-fetch';

export const handleDataError = async (e: unknown): Promise<Error> => {
  if (e instanceof Error && e.name === 'FetchError') {
    return new PineconeConnectionError();
  } else {
    const responseError = e as ResponseError;
    const message = await extractMessage(responseError);

    return mapHttpStatusError({
      status: responseError.response.status,
      url: responseError.response.url,
      message: message,
    });
  }
};
