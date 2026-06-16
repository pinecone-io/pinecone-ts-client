export { PreviewIndexes } from './indexes/previewIndexes';
export { PreviewIndex } from './indexes/previewIndex';
export { Preview } from './previewAccessor';

// listIndexes
export type {
  PreviewIndexList,
  PreviewIndexModel,
  PreviewIndexModelStatus,
  // Response-side sub-types of PreviewIndexModel (schema + read capacity)
  PreviewIndexSchema,
  PreviewIndexSchemaField,
  PreviewTypedIndexSchemaField,
  PreviewLegacyMetadataField,
  PreviewIntegerField,
  PreviewResponseStringField,
  PreviewResponseStringFieldFullTextSearch,
  PreviewReadCapacityResponse,
  PreviewReadCapacityDedicatedSpecResponse,
  PreviewReadCapacityOnDemandSpecResponse,
  PreviewReadCapacityDedicatedConfig,
  PreviewReadCapacityStatus,
  PreviewScalingConfigManual,
} from './indexes/listIndexes';

// createIndex
export type {
  PreviewCreateIndexOptions,
  PreviewCreateIndexSchema,
  PreviewCreateIndexSchemaField,
  PreviewIndexDeploymentRequest,
  PreviewIndexDeployment,
  PreviewManagedDeployment,
  PreviewByocDeployment,
  PreviewPodDeployment,
  PreviewBooleanField,
  PreviewDenseVectorField,
  PreviewFloatField,
  PreviewSemanticTextField,
  PreviewSparseVectorField,
  PreviewStringField,
  PreviewStringListField,
  PreviewStringFieldFullTextSearch,
  PreviewReadCapacity,
} from './indexes/createIndex';

// configureIndex
export type {
  PreviewConfigureIndexOptions,
  PreviewPatchIndexDeploymentRequest,
  PreviewPatchIndexSchema,
  PreviewPatchSemanticTextField,
} from './indexes/configureIndex';

// describeBackup
export type { PreviewBackupModel } from './indexes/describeBackup';

// createBackup
export type { PreviewCreateBackupOptions } from './indexes/createBackup';

// listIndexBackups
export type {
  PreviewListIndexBackupsOptions,
  PreviewBackupList,
  PreviewPaginationResponse,
} from './indexes/listIndexBackups';

// listProjectBackups
export type { PreviewListProjectBackupsOptions } from './indexes/listProjectBackups';

// createIndexFromBackup
export type {
  PreviewCreateIndexFromBackupOptions,
  PreviewCreateIndexFromBackupResponse,
} from './indexes/createIndexFromBackup';

// listRestoreJobs
export type {
  PreviewListRestoreJobsOptions,
  PreviewRestoreJobList,
} from './indexes/listRestoreJobs';

// describeRestoreJob
export type { PreviewRestoreJobModel } from './indexes/describeRestoreJob';

// listCollections
export type {
  PreviewCollectionList,
  PreviewCollectionModel,
} from './indexes/listCollections';

// createCollection
export type { PreviewCreateCollectionOptions } from './indexes/createCollection';

// upsertDocuments
export type {
  PreviewDocumentRecord,
  PreviewUpsertDocumentsOptions,
  PreviewUpsertDocumentsResponse,
} from './indexes/upsertDocuments';

// searchDocuments
export type {
  PreviewDocumentScoringMethod,
  PreviewSearchDocumentsOptions,
  PreviewDocumentSearchMatch,
  PreviewSearchDocumentsResponse,
  PreviewDocumentSearchUsage,
  PreviewSparseValues,
} from './indexes/searchDocuments';

// fetchDocuments
export type {
  PreviewFetchDocumentsOptions,
  PreviewFetchedDocument,
  PreviewFetchDocumentsResponse,
  PreviewDocumentFetchUsage,
} from './indexes/fetchDocuments';

// deleteDocuments
export type { PreviewDeleteDocumentsOptions } from './indexes/deleteDocuments';
