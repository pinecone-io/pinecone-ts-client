import type { ResponseError } from '../pinecone-generated-ts-fetch/db_control';

/** @internal */
export const extractMessage = async (error: ResponseError): Promise<string> => {
  let message = await error.response.text();

  // Error response is sometimes the raw message, sometimes it's JSON
  // so we will try to parse out the actual message text, but
  // we wrap it in a try to avoid crashing in a way that obscures
  // the actual error if the response format changes in the future.
  try {
    const messageJSON = JSON.parse(message);
    if (messageJSON.message) {
      message = messageJSON.message;
    }
  } catch (e) {
    // noop
  }

  return message;
};
