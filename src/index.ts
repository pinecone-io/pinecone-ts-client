export { Pinecone } from './pinecone';
export { Index } from './data';

export * as Errors from './errors';

// Type exports
export type {
  CollectionDescription,
  CollectionList,
  CollectionName,
  ConfigureIndexOptions,
  CreateCollectionOptions,
  CreateIndexOptions,
  DeleteCollectionOptions,
  DeleteIndexOptions,
  DescribeCollectionOptions,
  DescribeIndexOptions,
  IndexDescription,
  IndexList,
  IndexName,
  PartialIndexDescription,
  PartialCollectionDescription,
} from './control';
export type {
  DeleteManyByFilterOptions,
  DeleteManyByVectorIdOptions,
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
  QueryByRecordId,
  QueryByVectorValues,
  QueryOptions,
  QueryResponse,
  QueryShared,
  RecordId,
  RecordMetadata,
  RecordMetadataValue,
  RecordSparseValues,
  RecordValues,
  ScoredPineconeRecord,
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
