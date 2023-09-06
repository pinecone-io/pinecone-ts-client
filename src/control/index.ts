// Index Operations
export { configureIndex, type ConfigureIndexOptions } from './configureIndex';
export { createIndex, type CreateIndexOptions } from './createIndex';
export { deleteIndex, type DeleteIndexOptions } from './deleteIndex';
export {
  describeIndex,
  type DescribeIndexOptions,
  type IndexDescription,
} from './describeIndex';
export {
  listIndexes,
  type IndexList,
  type PartialIndexDescription,
} from './listIndexes';

// Collection Operations
export {
  createCollection,
  type CreateCollectionOptions,
} from './createCollection';
export {
  deleteCollection,
  type DeleteCollectionOptions,
} from './deleteCollection';
export {
  describeCollection,
  type DescribeCollectionOptions,
  type CollectionDescription,
} from './describeCollection';
export {
  listCollections,
  type CollectionList,
  type PartialCollectionDescription,
} from './listCollections';
