export { Pinecone } from './pinecone';
export { Index } from './data';

export * as Errors from './errors';

// Type exports
export type {
  ConfigureIndexOptions,
  CreateIndexOptions,
  DeleteIndexOptions,
  DescribeIndexOptions,
  IndexDescription,
  IndexList,
  PartialIndexDescription,
  CreateCollectionOptions,
  DeleteCollectionOptions,
  DescribeCollectionOptions,
  CollectionDescription,
  CollectionList,
  PartialCollectionDescription,
} from './control';
export type {
  PineconeConfiguration,
  PineconeRecord,
  RecordId,
  Values,
  SparseValues,
  DeleteManyOptions,
  DeleteOneOptions,
  DescribeIndexStatsOptions,
  IndexStatsDescription,
  FetchOptions,
  FetchResponse,
  UpdateVectorOptions,
  QueryByRecordId,
  QueryByVectorValues,
  QueryOptions,
  QueryResponse,
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
