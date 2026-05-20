export { PreviewIndexes } from './indexes/previewIndexes';

// Index list / model
export type { IndexList as PreviewIndexList } from '../pinecone-generated-ts-fetch-alpha/db_control';
export type {
  IndexModel as PreviewIndexModel,
  IndexModelStatus as PreviewIndexModelStatus,
} from '../pinecone-generated-ts-fetch-alpha/db_control';

// Create index
export type {
  PreviewCreateIndexOptions,
  PreviewCreateIndexSchema,
  PreviewCreateIndexSchemaField,
} from './indexes/createIndex';

// Deployment
export type {
  IndexDeploymentRequest as PreviewIndexDeploymentRequest,
  IndexDeployment as PreviewIndexDeployment,
  ManagedDeployment as PreviewManagedDeployment,
  ByocDeployment as PreviewByocDeployment,
  PodDeployment as PreviewPodDeployment,
} from '../pinecone-generated-ts-fetch-alpha/db_control';

// Schema field types
export type {
  BooleanField as PreviewBooleanField,
  DenseVectorField as PreviewDenseVectorField,
  FloatField as PreviewFloatField,
  SemanticTextField as PreviewSemanticTextField,
  SparseVectorField as PreviewSparseVectorField,
  StringField as PreviewStringField,
  StringListField as PreviewStringListField,
  StringFieldFullTextSearch as PreviewStringFieldFullTextSearch,
} from '../pinecone-generated-ts-fetch-alpha/db_control';

// Read capacity
export type { ReadCapacity as PreviewReadCapacity } from '../pinecone-generated-ts-fetch-alpha/db_control';

// Configure index
export type { PreviewConfigureIndexOptions } from './indexes/configureIndex';

// Create index for model
export type { PreviewCreateIndexForModelOptions } from './indexes/createIndexForModel';
export type {
  PatchIndexDeploymentRequest as PreviewPatchIndexDeploymentRequest,
  PatchIndexSchema as PreviewPatchIndexSchema,
  PatchSemanticTextField as PreviewPatchSemanticTextField,
} from '../pinecone-generated-ts-fetch-alpha/db_control';

// Create backup
export type { PreviewCreateBackupOptions } from './indexes/createBackup';
export type { BackupModel as PreviewBackupModel } from '../pinecone-generated-ts-fetch-alpha/db_control';

// List index backups
export type { PreviewListIndexBackupsOptions } from './indexes/listIndexBackups';
export type { BackupList as PreviewBackupList } from '../pinecone-generated-ts-fetch-alpha/db_control';

// List project backups
export type { PreviewListProjectBackupsOptions } from './indexes/listProjectBackups';
