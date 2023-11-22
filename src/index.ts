export { Pinecone } from './pinecone';
export { Index } from './data';

export * as Errors from './errors';

// Type exports
export type {
  CollectionName,
  ConfigureIndexOptions,
  CreateIndexOptions,
  DeleteCollectionOptions,
  DeleteIndexOptions,
  DescribeIndexOptions,
  IndexName,
  PodType,
} from './control';
export type {
  DeleteManyByFilterOptions,
  DeleteManyByRecordIdOptions,
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
export type {
  CollectionList,
  CollectionModel,
  ConfigureIndexRequest,
  CreateCollectionRequest,
  CreateIndexRequest,
  DescribeCollectionRequest,
  DescribeIndexRequest,
  FetchAPI,
  IndexList,
  IndexModel,
} from './pinecone-generated-ts-fetch';

// Legacy exports for backwards compatibility
export { PineconeClient } from './v0';
export { utils } from './v0/utils';
export {
  CreateCollectionRequest as CreateCollectionRequestV0,
  CreateRequest,
  DeleteRequest,
  PatchRequest,
  QueryRequest,
  QueryVector,
  ScoredVector,
  UpdateRequest,
  UpsertRequest,
  Vector,
} from './v0/pinecone-generated-ts-fetch';
