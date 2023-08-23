import { IndexOperationsApi } from '../pinecone-generated-ts-fetch';
import type { ResponseError } from '../pinecone-generated-ts-fetch';
import { mapHttpStatusError } from '../errors';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';
import { validIndexMessage } from './utils';

const DescribeIndexSchema = Type.String({ minLength: 1 });
export type IndexName = Static<typeof DescribeIndexSchema>;

export const deleteIndex = (api: IndexOperationsApi) => {
  const validator = buildConfigValidator(DescribeIndexSchema, 'deleteIndex');

  return async (indexName: IndexName): Promise<void> => {
    validator(indexName);

    try {
      await api.deleteIndex({ indexName: indexName });
      return;
    } catch (e) {
      const deleteError = e as ResponseError;
      const requestInfo = {
        status: deleteError.response.status,
      };

      let toThrow;
      if (requestInfo.status === 404) {
        const message = await validIndexMessage(api, indexName, requestInfo);
        toThrow = mapHttpStatusError({ ...requestInfo, message });
      } else {
        // 500? 401? This logical branch is not generally expected. Let
        // the http error mapper handle it, but we can't write a
        // message because we don't know what went wrong.
        toThrow = mapHttpStatusError(requestInfo);
      }
      throw toThrow;
    }
  };
};
