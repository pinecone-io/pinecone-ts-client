import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import {
  RecordIdSchema,
  RecordSparseValuesSchema,
  RecordValuesSchema,
} from './types';
import type { PineconeRecord, RecordMetadataValue } from './types';
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

export interface ScoredPineconeRecord<
  T extends Record<string, RecordMetadataValue>
> extends PineconeRecord<T> {
  score?: number;
}

export type QueryResponse<T extends Record<string, RecordMetadataValue>> = {
  matches?: Array<ScoredPineconeRecord<T>>;
  namespace: string;
};

export class QueryCommand<T extends Record<string, RecordMetadataValue>> {
  apiProvider: VectorOperationsProvider;
  namespace: string;
  validator: ReturnType<typeof buildConfigValidator>;

  constructor(apiProvider, namespace) {
    this.apiProvider = apiProvider;
    this.namespace = namespace;
    this.validator = buildConfigValidator(QuerySchema, 'query');
  }

  async run(query: QueryOptions): Promise<QueryResponse<T>> {
    this.validator(query);

    try {
      const api = await this.apiProvider.provide();
      const results = await api.query({
        queryRequest: { ...query, namespace: this.namespace },
      });
      return {
        matches: results.matches as Array<ScoredPineconeRecord<T>>,
        namespace: this.namespace,
      };
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  }
}
