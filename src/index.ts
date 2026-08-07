// Class, function exports
export { Pinecone } from './pinecone';
export { Index } from './data';
export { Indexes } from './control/indexes';
export { Collections } from './control/collections';
export { Backups } from './control/backups';
export { RestoreJobs } from './control/restoreJobs';
export { Assistants } from './assistant/control/assistants';
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

// Control-plane type exports
export type {
  BackupId,
  RestoreJobId,
  CollectionName,
  IndexName,
  PodType,
} from './control';
export type {
  // Indexes
  CreateIndexOptions,
  CreateIndexSchema,
  CreateIndexSchemaField,
  FullTextSearchStringField,
  CreateIndexForModelOptions,
  ConfigureIndexOptions,
  IndexList,
  IndexModel,
  IndexModelStatus,
  IndexSchema,
  IndexSchemaField,
  TypedIndexSchemaField,
  LegacyMetadataField,
  // Deployment (`deployment` on a created/described index)
  IndexDeployment,
  IndexDeploymentRequest,
  ManagedDeployment,
  ByocDeployment,
  PodDeployment,
  PatchIndexDeploymentRequest,
  // Schema field variants
  BooleanField,
  DenseVectorField,
  FloatField,
  IntegerField,
  SemanticTextField,
  SparseVectorField,
  StringField,
  StringListField,
  StringFieldFullTextSearch,
  StringFieldFullTextSearchNgram,
  ResponseStringField,
  ResponseStringFieldFullTextSearch,
  ResponseStringFieldFullTextSearchNgram,
  PatchIndexSchema,
  PatchSemanticTextField,
  // Read capacity (request side; hand-rolled)
  ReadCapacity,
  ReadCapacityOnDemand,
  ReadCapacityDedicated,
  ReadCapacityDedicatedSettings,
  ScalingConfigManualInput,
  DedicatedNodeType,
  ReadCapacityScaling,
  // Read capacity (response side; generated)
  ReadCapacityResponse,
  ReadCapacityDedicatedConfig,
  ReadCapacityDedicatedSpecResponse,
  ReadCapacityOnDemandSpecResponse,
  ReadCapacityStatus,
  ScalingConfigManual,
} from './control/indexes';
export type {
  BackupModel,
  BackupList,
  BackupListPagination,
  CreateBackupOptions,
  ListIndexBackupsOptions,
  ListProjectBackupsOptions,
  CreateIndexFromBackupOptions,
  CreateIndexFromBackupResponse,
} from './control/backups';
export type {
  ListRestoreJobsOptions,
  RestoreJobList,
  RestoreJobModel,
} from './control/restoreJobs';
export type {
  CollectionList,
  CollectionModel,
  CreateCollectionOptions,
} from './control/collections';
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
  // Document operations (schema-based indexes)
  DocumentRecord,
  UpsertDocumentsOptions,
  UpsertDocumentsResponse,
  DocumentScoringMethod,
  SearchDocumentsOptions,
  DocumentSearchMatch,
  SearchDocumentsResponse,
  DocumentSearchUsage,
  SparseValues,
  FetchDocumentsOptions,
  FetchedDocument,
  FetchDocumentsResponse,
  DocumentFetchUsage,
  DeleteDocumentsOptions,
  ListDocumentsOptions,
  ListDocumentsResponse,
  ListedDocumentRecord,
  DocumentListUsage,
  DocumentPagination,
  UpdateDocumentsOptions,
  UpdateDocumentRecord,
} from './data';
export type {
  ConfigureIndexRequest,
  CreateCollectionRequest,
  CreateIndexForModelRequest,
  CreateIndexRequest,
  DescribeCollectionRequest,
  DescribeIndexRequest,
  FetchAPI,
} from './pinecone-generated-ts-fetch/db_control';

// --- Admin API exports ---
export { AdminClient } from './admin';
// Per-resource classes backing the `admin.*` sub-clients (e.g. `admin.projects`), exported so they
// can be referenced in type annotations, mirroring `Inference` / `Indexes` / `Assistant`.
export {
  ProjectsResource,
  OrganizationsResource,
  ApiKeysResource,
  ServiceAccountsResource,
  RoleBindingsResource,
  InvitesResource,
  UsersResource,
} from './admin';
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
