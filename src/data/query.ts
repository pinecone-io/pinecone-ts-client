import type { QueryResponse as GeneratedQueryResponse } from '../pinecone-generated-ts-fetch';
import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import {
  RecordSparseValuesSchema,
  RecordIdSchema,
  RecordValuesSchema,
} from './types';
import { Static, Type } from '@sinclair/typebox';
import { VectorOperationsProvider } from './vectorOperationsProvider';

const shared = {
  topK: Type.Number(),
  includeValues: Type.Optional(Type.Boolean()),
  includeMetadata: Type.Optional(Type.Boolean()),
  filter: Type.Optional(Type.Object({})),
};

const QueryByRecordId = Type.Object({
  ...shared,
  id: RecordIdSchema,
  vector: Type.Optional(Type.Never()),
  sparseVector: Type.Optional(Type.Never()),
});

const QueryByVectorValues = Type.Object({
  ...shared,
  vector: RecordValuesSchema,
  sparseVector: Type.Optional(RecordSparseValuesSchema),
  id: Type.Optional(Type.Never()),
});

const QuerySchema = Type.Union([QueryByRecordId, QueryByVectorValues]);

export type QueryByRecordId = Static<typeof QueryByRecordId>;
export type QueryByVectorValues = Static<typeof QueryByVectorValues>;
export type QueryOptions = Static<typeof QuerySchema>;
export type QueryResponse = GeneratedQueryResponse;

export const query = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  const validator = buildConfigValidator(QuerySchema, 'query');

  return async (query: QueryOptions): Promise<QueryResponse> => {
    validator(query);

    try {
      const api = await apiProvider.provide();
      const results = await api.query({
        queryRequest: { ...query, namespace },
      });
      delete results.results;
      return results;
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};
