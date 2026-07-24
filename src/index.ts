// Class, function exports
export { Pinecone } from './pinecone';
export { Index } from './data';
export { Inference } from './inference';
export { Assistant, ChatStream } from './assistant';
export * as Errors from './errors';

// Interface exports
export type {
  RerankOptions,
  ListModelsOptions,
  EmbedOptions,
} from './inference';
export type {
  RerankResult,
  RerankResultUsage,
  RankedDocument,
  EmbeddingsList,
  EmbeddingsListUsage,
  Embedding,
  DenseEmbedding,
  SparseEmbedding,
  ModelInfo,
  ModelInfoList,
  ModelInfoSupportedParameter,
  ModelInfoSupportedParameterAllowedValuesInner,
  ModelInfoSupportedParameterDefault,
} from './pinecone-generated-ts-fetch/inference';
export type {
  HTTPHeaders,
  Hit,
  ImportModel,
  ImportErrorMode,
  ListImportsResponse,
  ListResponse,
  ListItem,
  ListNamespacesResponse,
  Pagination,
  NamespaceDescription,
  CreateNamespaceRequestSchema,
  CreateNamespaceRequestSchemaFieldsValue,
  NamespaceDescriptionIndexedFields,
  SearchMatchTerms,
  SearchRecordsResponse,
  SearchRecordsResponseResult,
  SearchUsage,
  StartImportResponse,
  Usage,
} from './pinecone-generated-ts-fetch/db_data';
export type {
  CreateAssistantOptions,
  UpdateAssistantOptions,
  UpdateAssistantResponse,
  AssistantList,
  AssistantModel,
  EvaluateOptions,
  ChatOptions,
  ChatContextOptions,
  ChatCompletionOptions,
  ContextOptions,
  ListFilesOptions,
  ListOperationsOptions,
  UploadFileOptions,
  UpsertFileOptions,
  Uploadable,
  AssistantFilesList,
  MessagesModel,
  MessageModel,
  ChatModelEnum,
  ChoiceModel,
  FinishReasonEnum,
  StreamedChatResponse,
  StreamedChatCompletionResponse,
  BaseChunk,
  MessageStartChunk,
  ContentChunk,
  CitationChunk,
  MessageEndChunk,
} from './assistant';
export type {
  ChatModel,
  ChatCompletionModel,
  CitationModel,
  ContextModel,
  HighlightModel,
  ImageModel,
  MultiModalContentBlocksModel,
  MultiModalContentImageBlockModel,
  MultiModalContentTextBlockModel,
  MultiModalSnippetModel,
  ReferenceModel,
  SnippetModel,
  TextReferenceModel,
  TextSnippetModel,
  TypedReferenceModel,
  UsageModel,
  PdfReferenceModel,
  DocxReferenceModel,
  JsonReferenceModel,
  MarkdownReferenceModel,
  AssistantFileModel,
  OperationModel,
  OperationList,
  PaginationResponse,
  ContentFilterResults,
  // Generated (non-streaming) chat/completion response sub-types. Aliased to
  // avoid colliding with the wrapper's input/streaming `MessageModel` and
  // `ChoiceModel` (exported from './assistant'), which have different shapes:
  // the wrapper `ChoiceModel` carries a streaming `delta`, whereas the generated
  // one carries a full `message`.
  MessageModel as ChatMessageModel,
  ChoiceModel as ChatCompletionChoiceModel,
} from './pinecone-generated-ts-fetch/assistant_data';
export type {
  AlignmentResponse,
  Metrics,
  Reasoning,
  EvaluatedFact,
  Fact,
  TokenCounts,
} from './pinecone-generated-ts-fetch/assistant_evaluation';

// Type exports
export type {
  BackupId,
  RestoreJobId,
  CollectionName,
  CreateBackupOptions,
  CreateIndexFromBackupOptions,
  DescribeBackupOptions,
  DescribeRestoreJobOptions,
  ListRestoreJobsOptions,
  DeleteBackupOptions,
  CreateIndexOptions,
  CreateIndexSpec,
  CreateIndexServerlessSpec,
  CreateIndexPodSpec,
  CreateIndexByocSpec,
  CreateIndexReadCapacity,
  DedicatedNodeType,
  ReadCapacityOnDemandParams,
  ReadCapacityDedicatedParams,
  ConfigureIndexOptions,
  CreateIndexForModelOptions,
  CreateIndexForModelEmbed,
  DeleteCollectionOptions,
  DeleteIndexOptions,
  DescribeIndexOptions,
  DescribeCollectionOptions,
  IndexName,
  ListBackupsOptions,
  PodType,
} from './control';
export type { IndexOptions, AssistantOptions } from './types';
export type {
  CreateNamespaceOptions,
  DeleteAllOptions,
  DeleteManyOptions,
  DeleteOneOptions,
  DescribeIndexStatsOptions,
  FetchOptions,
  FetchResponse,
  FetchByMetadataOptions,
  FetchByMetadataResponse,
  IndexStatsDescription,
  IndexStatsNamespaceSummary,
  IntegratedRecord,
  ListOptions,
  ListNamespacesOptions,
  OperationUsage,
  PineconeConfiguration,
  PineconeRecord,
  UpdateOptions,
  UpsertOptions,
  UpsertRecordsOptions,
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
  SearchRecordsOptions,
  SearchRecordsQuery,
  SearchRecordsRerank,
  SearchRecordsVector,
  StartImportOptions,
} from './data';
export type {
  BackupList,
  BackupModel,
  ByocSpec,
  ByocSpecResponse,
  CollectionList,
  CollectionModel,
  ConfigureIndexRequestSpec,
  ConfigureIndexRequestEmbed,
  CreateCollectionRequest,
  CreateIndexForModelRequest,
  CreateIndexFromBackupResponse,
  CreateIndexRequest,
  DescribeCollectionRequest,
  DescribeIndexRequest,
  FetchAPI,
  IndexList,
  IndexModel,
  IndexModelSpec,
  IndexModelStatus,
  ModelIndexEmbed,
  // Members of the `IndexModelSpec` discriminated union (`spec` field on a
  // described/created index). Aliased to stable public names because the
  // generator's numeric suffixes reshuffle across regens — re-point the
  // left-hand side after each regen; the public names stay fixed.
  Serverless1 as Serverless2,
  PodBased1 as PodBased,
  BYOC1 as BYOC2,
  MetadataSchema,
  MetadataSchemaFieldsValue,
  PodSpec,
  PodSpecMetadataConfig,
  ReadCapacity,
  ReadCapacityDedicatedConfig,
  ReadCapacityDedicatedSpec,
  ReadCapacityDedicatedSpecResponse,
  ReadCapacityOnDemandSpec,
  ReadCapacityOnDemandSpecResponse,
  ReadCapacityResponse,
  ReadCapacityStatus,
  RestoreJobList,
  RestoreJobModel,
  ScalingConfigManual,
  ServerlessSpec,
  ServerlessSpecResponse,
  // Pagination cursor on `BackupList` / `RestoreJobList`. Aliased to avoid
  // colliding with the identically-named `PaginationResponse` already exported
  // from the assistant data plane.
  PaginationResponse as BackupPaginationResponse,
} from './pinecone-generated-ts-fetch/db_control';

// --- Alpha / Preview exports (2026-01.alpha) ---
export { PreviewIndexes, PreviewIndex, Preview } from './preview';
export type {
  // Index list / model
  PreviewIndexList,
  PreviewIndexModel,
  PreviewIndexModelStatus,
  // Response-side schema (the `schema` field on a returned PreviewIndexModel)
  PreviewIndexSchema,
  PreviewIndexSchemaField,
  PreviewTypedIndexSchemaField,
  PreviewLegacyMetadataField,
  PreviewIntegerField,
  PreviewResponseStringField,
  PreviewResponseStringFieldFullTextSearch,
  // Create index
  PreviewCreateIndexOptions,
  PreviewCreateIndexSchema,
  PreviewCreateIndexSchemaField,
  // Deployment
  PreviewIndexDeploymentRequest,
  PreviewIndexDeployment,
  PreviewManagedDeployment,
  PreviewByocDeployment,
  PreviewPodDeployment,
  // Schema field types
  PreviewBooleanField,
  PreviewDenseVectorField,
  PreviewFloatField,
  PreviewSemanticTextField,
  PreviewSparseVectorField,
  PreviewStringField,
  PreviewStringListField,
  PreviewStringFieldFullTextSearch,
  // Read capacity (request-side)
  PreviewReadCapacity,
  // Read capacity (response-side: the `readCapacity` field on a returned PreviewIndexModel)
  PreviewReadCapacityResponse,
  PreviewReadCapacityDedicatedSpecResponse,
  PreviewReadCapacityOnDemandSpecResponse,
  PreviewReadCapacityDedicatedConfig,
  PreviewReadCapacityStatus,
  PreviewScalingConfigManual,
  // Configure index
  PreviewConfigureIndexOptions,
  PreviewPatchIndexDeploymentRequest,
  PreviewPatchIndexSchema,
  PreviewPatchSemanticTextField,
  // Backup
  PreviewCreateBackupOptions,
  PreviewBackupModel,
  // List index backups
  PreviewListIndexBackupsOptions,
  PreviewBackupList,
  PreviewPaginationResponse,
  // List project backups
  PreviewListProjectBackupsOptions,
  // Create index from backup
  PreviewCreateIndexFromBackupOptions,
  PreviewCreateIndexFromBackupResponse,
  // List restore jobs
  PreviewListRestoreJobsOptions,
  PreviewRestoreJobList,
  PreviewRestoreJobModel,
  // List collections
  PreviewCollectionList,
  PreviewCollectionModel,
  // Create collection
  PreviewCreateCollectionOptions,
  // Upsert documents (data plane)
  PreviewDocumentRecord,
  PreviewUpsertDocumentsOptions,
  PreviewUpsertDocumentsResponse,
  // Search documents (data plane)
  PreviewDocumentScoringMethod,
  PreviewSearchDocumentsOptions,
  PreviewDocumentSearchMatch,
  PreviewSearchDocumentsResponse,
  PreviewDocumentSearchUsage,
  // Fetch documents (data plane)
  PreviewFetchDocumentsOptions,
  PreviewFetchedDocument,
  PreviewFetchDocumentsResponse,
  PreviewDocumentFetchUsage,
  // Delete documents (data plane)
  PreviewDeleteDocumentsOptions,
  // Shared data-plane types
  PreviewSparseValues,
} from './preview';

// --- Admin API exports (2026-04) ---
export { AdminClient } from './admin';
export type {
  AdminClientConfiguration,
  CreateProjectOptions,
  UpdateProjectOptions,
  UpdateOrganizationOptions,
  CreateApiKeyOptions,
  UpdateApiKeyOptions,
  CreateServiceAccountOptions,
  UpdateServiceAccountOptions,
  ListServiceAccountsOptions,
  CreateRoleBindingOptions,
  ListRoleBindingsOptions,
  CreateInviteOptions,
  ListInvitesOptions,
  ListUsersOptions,
} from './admin';
export type {
  Project,
  ProjectList,
  Organization,
  OrganizationList,
  APIKey,
  APIKeyWithSecret,
  ListApiKeysResponse,
  ServiceAccount,
  ServiceAccountWithSecret,
  ServiceAccountList,
  RoleBinding,
  RoleBindingInput,
  RoleBindingList,
  Invite,
  InviteList,
  InviteListPagination,
  User,
  UserList,
  // Admin has its own generically-named error types. Aliased to avoid colliding with
  // identically-named types other modules may export in the future.
  ErrorResponse as AdminErrorResponse,
  ErrorResponseError as AdminErrorResponseError,
} from './pinecone-generated-ts-fetch/admin';
