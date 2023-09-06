export { Pinecone } from './pinecone';
export { Index } from './data';

export * as Errors from './errors';

// Type exports
export type {
  CollectionDescription,
  CollectionList,
  ConfigureIndexOptions,
  CreateCollectionOptions,
  CreateIndexOptions,
  DeleteCollectionOptions,
  DeleteIndexOptions,
  DescribeCollectionOptions,
  DescribeIndexOptions,
  IndexDescription,
  IndexList,
  PartialIndexDescription,
  PartialCollectionDescription,
} from './control';
export type {
  DeleteManyOptions,
  DeleteOneOptions,
  DescribeIndexStatsOptions,
  FetchOptions,
  FetchResponse,
  IndexStatsDescription,
  IndexStatsNamespaceSummary,
  PineconeConfiguration,
  PineconeRecord,
  UpdateOptions,
  UpsertOptions,
  QueryByRecordId,
  QueryByVectorValues,
  QueryOptions,
  QueryResponse,
  RecordId,
  SparseValues,
  Values,
} from './data';

// Legacy exports for backwards compatibility
export { PineconeClient } from './v0';
export { utils } from './v0/utils';
export {
  CreateCollectionRequest,
  CreateRequest,
  DeleteRequest,
  IndexMeta,
  PatchRequest,
  QueryRequest,
  QueryVector,
  ScoredVector,
  UpdateRequest,
  UpsertRequest,
  Vector,
} from './pinecone-generated-ts-fetch';
