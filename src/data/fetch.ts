import type { FetchResponse } from '../pinecone-generated-ts-fetch';
import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';
import { VectorOperationsProvider } from './vectorOperationsProvider';

const IdsArray = Type.Array(Type.String({ minLength: 1 }), { minItems: 1 });
export type IdsArray = Static<typeof IdsArray>;

export const fetch = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  const validator = buildConfigValidator(IdsArray, 'fetch');

  return async (ids: IdsArray): Promise<FetchResponse> => {
    validator(ids);

    try {
      const api = await apiProvider.provide();
      return await api.fetch({ ids: ids, namespace });
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};
