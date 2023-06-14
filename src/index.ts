export { Pinecone } from './pinecone';
export type { ClientConfiguration, ClientConfigurationInit } from './pinecone';

// Legacy exports for backwards compatibility
export { PineconeClient } from './v0';
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
export { utils } from './v0/utils';
