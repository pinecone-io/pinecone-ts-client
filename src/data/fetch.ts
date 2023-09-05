import type { FetchResponse as GeneratedFetchResponse } from '../pinecone-generated-ts-fetch';
import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import { VectorOperationsProvider } from './vectorOperationsProvider';
import { RecordIdSchema, type RecordId } from './types';
import { Type } from '@sinclair/typebox';

const RecordIdsArray = Type.Array(RecordIdSchema, { minItems: 1 });
export type FetchOptions = Array<RecordId>;

export type FetchResponse = GeneratedFetchResponse;

export const fetch = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  const validator = buildConfigValidator(RecordIdsArray, 'fetch');

  return async (ids: FetchOptions): Promise<FetchResponse> => {
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
