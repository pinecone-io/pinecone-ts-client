// Class, function exports
export { Pinecone } from './pinecone';
export { Index } from './data';
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
export {
  CreateAssistantRequest,
  UpdateAssistantOperationRequest,
  UpdateAssistantRequest,
} from './pinecone-generated-ts-fetch/assistant_control';
export { createAssistantRequest } from './assistant/control/createAssistant';
export { updateAssistant } from './assistant/control/updateAssistant';
export { ChatRequest } from './assistant/data/chat';
export { ChatCompletionRequest } from './assistant/data/chatCompletion';
export { DeleteFile } from './assistant/data/deleteFile';
export { DescribeFile } from './assistant/data/describeFile';
export { ListFiles } from './assistant/data/listFiles';
export { UploadFile } from './assistant/data/uploadFile';
export { Context } from './assistant/data/context';
export { Eval } from './assistant/data/evaluate';

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
