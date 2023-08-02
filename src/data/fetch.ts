import { FetchError, VectorOperationsApi } from '../pinecone-generated-ts-fetch';
import type { ResponseError, FetchResponse } from '../pinecone-generated-ts-fetch';
import { mapHttpStatusError } from '../errors';
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
        throw 'Request failed to reach the server. Are you sure you are connected to the internet?'
      } else {
        const fetchError = e as ResponseError;
        const message = await fetchError.response.text();
        throw mapHttpStatusError({
          status: fetchError.response.status,
          url: fetchError.response.url,
          message: message,
        });
      }
    }
  };
};
