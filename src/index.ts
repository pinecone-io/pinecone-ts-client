export { Pinecone, type ClientConfigurationInit } from './pinecone';
export { Client, type ClientConfiguration } from './client';

export * as Errors from './errors';

//Type exports
export type { CreateIndexOptions, IndexList, IndexName } from './control';
export type {
  DeleteManyOptions,
  DeleteOneOptions,
  DescribeIndexStatsOptions,
  IdsArray,
  QueryByVectorId,
  QueryByVectorValues,
  QueryOptions,
  SparseValues,
  UpdateVectorOptions,
  VectorArray,
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
