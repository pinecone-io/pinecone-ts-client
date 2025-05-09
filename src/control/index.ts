// Index Operations
export { indexOperationsBuilder } from './indexOperationsBuilder';
export type { IndexName, PodType } from './types';
export { configureIndex } from './configureIndex';
export { createIndex } from './createIndex';
export type {
  CreateIndexOptions,
  CreateIndexSpec,
  CreateIndexServerlessSpec,
  CreateIndexPodSpec,
} from './createIndex';
export { createIndexForModel } from './createIndexForModel';
export type {
  CreateIndexForModelOptions,
  CreateIndexForModelEmbed,
} from './createIndexForModel';
export { deleteIndex } from './deleteIndex';
export type { DeleteIndexOptions } from './deleteIndex';
export { describeIndex } from './describeIndex';
export type { DescribeIndexOptions } from './describeIndex';
export { listIndexes } from './listIndexes';

// Collection Operations
export type { CollectionName } from './types';
export { createCollection } from './createCollection';
export { deleteCollection } from './deleteCollection';
export type { DeleteCollectionOptions } from './deleteCollection';
export { describeCollection } from './describeCollection';
export type { DescribeCollectionOptions } from './describeCollection';
export { listCollections } from './listCollections';

// Backup Operations
export { createBackup } from './createBackup';
export type { CreateBackupOptions } from './createBackup';
export { createIndexFromBackup } from './createIndexFromBackup';
export type { CreateIndexFromBackupOptions } from './createIndexFromBackup';
export { describeBackup } from './describeBackup';
export type { DescribeBackupOptions } from './describeBackup';
export { describeRestoreJob } from './describeRestoreJob';
export type { DescribeRestoreJobOptions } from './describeRestoreJob';
export { listBackups } from './listBackups';
export type { ListBackupsOptions } from './listBackups';
export { listRestoreJobs } from './listRestoreJobs';
export type { ListRestoreJobsOptions } from './listRestoreJobs';
export { deleteBackup } from './deleteBackup';
export type { DeleteBackupOptions } from './deleteBackup';
