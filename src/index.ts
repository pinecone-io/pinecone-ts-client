// Class, function exports
export { Pinecone } from './pinecone';
export { Index } from './data';
export { Assistant } from './assistant';
export * as Errors from './errors';
export { EmbeddingsList } from './models/embeddingsList';

// Interface exports
export { RerankOptions } from './inference/inference';
export {
  RerankResult,
  RerankResultUsage,
  RankedDocument,
} from './pinecone-generated-ts-fetch/inference';
export type { ListResponse } from './pinecone-generated-ts-fetch/db_data';
export type {
  CreateAssistantOptions,
  UpdateAssistantOptions,
} from './assistant/control';

// Type exports
export type {
  CollectionName,
  CreateIndexOptions,
  DeleteCollectionOptions,
  DeleteIndexOptions,
  DescribeIndexOptions,
  DescribeCollectionOptions,
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
  ConfigureIndexRequestSpecPod,
  CreateCollectionRequest,
  CreateIndexRequest,
  CreateIndexRequestMetricEnum,
  DeletionProtection,
  DescribeCollectionRequest,
  DescribeIndexRequest,
  FetchAPI,
  IndexList,
  IndexModel,
  ServerlessSpec,
  ServerlessSpecCloudEnum,
  PodSpec,
  PodSpecMetadataConfig,
} from './pinecone-generated-ts-fetch/db_control';
