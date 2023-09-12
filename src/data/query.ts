import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import {
  RecordIdSchema,
  RecordSparseValuesSchema,
  RecordValues,
  RecordValuesSchema,
} from './types';
import type { PineconeRecord, RecordMetadata } from './types';
import { Type } from '@sinclair/typebox';
import { VectorOperationsProvider } from './vectorOperationsProvider';

const shared = {
  topK: Type.Number(),
  includeValues: Type.Optional(Type.Boolean()),
  includeMetadata: Type.Optional(Type.Boolean()),
  filter: Type.Optional(Type.Object({})),
};

const QueryByRecordId = Type.Object(
  {
    ...shared,
    id: RecordIdSchema,
    vector: Type.Optional(Type.Never()),
    sparseVector: Type.Optional(Type.Never()),
  },
  { additionalProperties: false }
);

const QueryByVectorValues = Type.Object(
  {
    ...shared,
    vector: RecordValuesSchema,
    sparseVector: Type.Optional(RecordSparseValuesSchema),
    id: Type.Optional(Type.Never()),
  },
  { additionalProperties: false }
);

const QuerySchema = Type.Union([QueryByRecordId, QueryByVectorValues]);

type QueryShared = {
  topK: number;
  includeValues?: boolean;
  includeMetadata?: boolean;
  filter?: object;
};
export type QueryByRecordId = QueryShared & { id: string };
export type QueryByVectorValues = QueryShared & { vector: RecordValues };
export type QueryOptions = QueryByRecordId | QueryByVectorValues;

export interface ScoredPineconeRecord<T extends RecordMetadata = RecordMetadata>
  extends PineconeRecord<T> {
  score?: number;
}

export type QueryResponse<T extends RecordMetadata = RecordMetadata> = {
  matches?: Array<ScoredPineconeRecord<T>>;
  namespace: string;
};

export class QueryCommand<T extends RecordMetadata = RecordMetadata> {
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
