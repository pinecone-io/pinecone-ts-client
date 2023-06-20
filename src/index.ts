export { Pinecone, type ClientConfigurationInit } from './pinecone';
export { Client, type ClientConfiguration } from './client';
export * as Errors from './errors';
export type { IndexName, IndexList, CreateIndexOptions } from './control';

// Legacy exports for backwards compatibility
export { PineconeClient } from './v0';
export { utils } from './v0/utils';
export {
  QueryRequest,
  CreateRequest,
  UpdateRequest,
  DeleteRequest,
  UpsertRequest,
  Vector,
  QueryVector,
  PatchRequest,
  IndexMeta,
  CreateCollectionRequest,
  ScoredVector,
} from './pinecone-generated-ts-fetch';
