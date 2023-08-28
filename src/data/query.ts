import { VectorOperationsApi } from '../pinecone-generated-ts-fetch';
import type { QueryResponse } from '../pinecone-generated-ts-fetch';
import { handleDataError } from './utils/errorHandling';
import { buildConfigValidator } from '../validator';
import { SparseValuesSchema } from './upsert';

import { Static, Type } from '@sinclair/typebox';

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

const Query = Type.Union([QueryByVectorId, QueryByVectorValues]);

export type QueryByVectorId = Static<typeof QueryByVectorId>;
export type QueryByVectorValues = Static<typeof QueryByVectorValues>;
export type Query = Static<typeof Query>;

export const query = (api: VectorOperationsApi, namespace: string) => {
  const validator = buildConfigValidator(Query, 'query');

  return async (query: Query): Promise<QueryResponse> => {
    validator(query);

    try {
      const results = await api.query({
        queryRequest: { ...query, namespace },
      });
      delete results.results;
      return results;
    } catch (e) {
      const err = await handleDataError(e);
      throw err;
    }
  };
};
