import { FetchError, VectorOperationsApi } from '../pinecone-generated-ts-fetch';
import type { ResponseError, FetchResponse } from '../pinecone-generated-ts-fetch';
import { mapHttpStatusError, PineconeConnectionError } from '../errors';
import { builOptionConfigValidator } from '../validator';

import { Static, Type } from '@sinclair/typebox';

const IdsArray = Type.Array(Type.String({ minLength: 1 }));
export type IdsArray = Static<typeof IdsArray>;

export const fetch = (api: VectorOperationsApi, namespace: string) => {
  const validator = builOptionConfigValidator(
    IdsArray,
    'fetch'
  );

  return async (ids: IdsArray): Promise<FetchResponse> => {
    validator(ids);

    try {
      const vectors = await api.fetch({ ids: ids, namespace }); 
      return vectors;
    } catch (e) {
      if (e instanceof Error && e.name === 'FetchError') {
        throw new PineconeConnectionError('Request failed to reach the server. Are you sure you are targeting an index that exists?')
      } else {
        const fetchError = e as ResponseError;
        let message = await fetchError.response.text();

        // Error response of this endpoint seems different from others,
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

        throw mapHttpStatusError({
          status: fetchError.response.status,
          url: fetchError.response.url,
          message: message,
        });
      }
    }
  };
};
