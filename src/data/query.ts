import type { QueryResponse } from '../pinecone-generated-ts-fetch';
import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import { SparseValuesSchema } from './upsert';
import { Static, Type } from '@sinclair/typebox';
import { VectorOperationsProvider } from './vectorOperationsProvider';

const nonemptyString = Type.String({ minLength: 1 });

const shared = {
  topK: Type.Number(),
  includeValues: Type.Optional(Type.Boolean()),
  includeMetadata: Type.Optional(Type.Boolean()),
  filter: Type.Optional(Type.Object({})),
};

const QueryByVectorId = Type.Object({
  ...shared,
  id: nonemptyString,
  vector: Type.Optional(Type.Never()),
  sparseVector: Type.Optional(Type.Never()),
});

const QueryByVectorValues = Type.Object({
  ...shared,
  vector: Type.Array(Type.Number()),
  sparseVector: Type.Optional(SparseValuesSchema),
  id: Type.Optional(Type.Never()),
});

const QuerySchema = Type.Union([QueryByVectorId, QueryByVectorValues]);

export type QueryByVectorId = Static<typeof QueryByVectorId>;
export type QueryByVectorValues = Static<typeof QueryByVectorValues>;
export type QueryOptions = Static<typeof QuerySchema>;

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
