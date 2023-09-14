// Index Operations
export { configureIndex } from './configureIndex';
export type { ConfigureIndexOptions } from './configureIndex';
export { createIndex } from './createIndex';
export type { CreateIndexOptions } from './createIndex';
export { deleteIndex } from './deleteIndex';
export type { DeleteIndexOptions } from './deleteIndex';
export { describeIndex } from './describeIndex';
export type { DescribeIndexOptions, IndexDescription } from './describeIndex';
export { listIndexes } from './listIndexes';
export type { IndexList, PartialIndexDescription } from './listIndexes';

// Collection Operations
export { createCollection } from './createCollection';
export type { CreateCollectionOptions } from './createCollection';

export { deleteCollection } from './deleteCollection';
export type { DeleteCollectionOptions } from './deleteCollection';

export { describeCollection } from './describeCollection';
export type {
  DescribeCollectionOptions,
  CollectionDescription,
} from './describeCollection';
export { listCollections } from './listCollections';
export type {
  CollectionList,
  PartialCollectionDescription,
} from './listCollections';
