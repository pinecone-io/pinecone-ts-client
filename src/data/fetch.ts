import { VectorOperationsApi } from '../pinecone-generated-ts-fetch';
import type { FetchResponse } from '../pinecone-generated-ts-fetch';
import { handleDataError } from './utils/errorHandling';
import { builOptionConfigValidator } from '../validator';

import { Static, Type } from '@sinclair/typebox';

const IdsArray = Type.Array(Type.String({ minLength: 1 }));
export type IdsArray = Static<typeof IdsArray>;

export const fetch = (api: VectorOperationsApi, namespace: string) => {
  const validator = builOptionConfigValidator(IdsArray, 'fetch');

  return async (ids: IdsArray): Promise<FetchResponse> => {
    validator(ids);

    try {
      return await api.fetch({ ids: ids, namespace });
    } catch (e) {
      const err = await handleDataError(e);
      throw err;
    }
  };
};
