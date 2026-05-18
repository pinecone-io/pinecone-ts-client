/* tslint:disable */
/* eslint-disable */
/**
 * The list of backups that exist in the project.
 * @export
 * @interface BackupList
 */
export interface BackupList {
    /**
     * List of backup objects
     * @type {Array<BackupModel>}
     * @memberof BackupList
     */
    data?: Array<BackupModel>;
    /**
     * 
     * @type {PaginationResponse}
     * @memberof BackupList
     */
    pagination?: PaginationResponse;
}
/**
 * The BackupModel describes the configuration and status of a Pinecone backup.
 * @export
 * @interface BackupModel
 */
export interface BackupModel {
    /**
     * Unique identifier for the backup.
     * @type {string}
     * @memberof BackupModel
     */
    backup_id: string;
    /**
     * Name of the index from which the backup was taken.
     * @type {string}
     * @memberof BackupModel
     */
    source_index_name: string;
    /**
     * ID of the index from which the backup was taken.
     * @type {string}
     * @memberof BackupModel
     */
    source_index_id: string;
    /**
     * Optional user-defined name for the backup.
     * @type {string}
     * @memberof BackupModel
     */
    name?: string;
    /**
     * Optional description providing context for the backup.
     * @type {string}
     * @memberof BackupModel
     */
    description?: string;
    /**
     * Current status of the backup.
     * @type {string}
     * @memberof BackupModel
     */
    status: string;
    /**
     * Cloud provider where the backup is stored.
     * @type {string}
     * @memberof BackupModel
     */
    cloud: string;
    /**
     * Cloud region where the backup is stored.
     * @type {string}
     * @memberof BackupModel
     */
    region: string;
    /**
     * 
     * @type {IndexSchema}
     * @memberof BackupModel
     */
    schema?: IndexSchema;
    /**
     * Total number of records in the backup.
     * @type {number}
     * @memberof BackupModel
     */
    record_count?: number;
    /**
     * Number of namespaces in the backup.
     * @type {number}
     * @memberof BackupModel
     */
    namespace_count?: number;
    /**
     * Size of the backup in bytes.
     * @type {number}
     * @memberof BackupModel
     */
    size_bytes?: number;
    /**
     * Custom user tags added to an index. Keys must be 80 characters or less. Values must be 120 characters or less. Keys must be alphanumeric, '_', or '-'.  Values must be alphanumeric, ';', '@', '_', '-', '.', '+', or ' '. To unset a key, set the value to be an empty string.
     * @type {{ [key: string]: string; }}
     * @memberof BackupModel
     */
    tags?: { [key: string]: string; };
    /**
     * Timestamp when the backup was created.
     * @type {string}
     * @memberof BackupModel
     */
    created_at?: string;
}
/**
 * A boolean field configuration. Can be indexed for use in metadata filter expressions.
 * @export
 * @interface BooleanField
 */
export interface BooleanField {
    /**
     * Identifies this as a boolean field. Must be `boolean`.
     * @type {string}
     * @memberof BooleanField
     */
    type: BooleanFieldTypeEnum;
    /**
     * Optional description for this field.
     * @type {string}
     * @memberof BooleanField
     */
    description?: string;
    /**
     * Whether this field should be indexed for use in filter expressions.
     * @type {boolean}
     * @memberof BooleanField
     */
    filterable?: boolean;
}


/**
 * @export
 */
export const BooleanFieldTypeEnum = {
    Boolean: 'boolean'
} as const;
export type BooleanFieldTypeEnum = typeof BooleanFieldTypeEnum[keyof typeof BooleanFieldTypeEnum];

/**
 * Deployment configuration for a bring-your-own-compute (BYOC) index.
 * @export
 * @interface ByocDeployment
 */
export interface ByocDeployment {
    /**
     * Identifies this as a BYOC deployment. Must be `byoc`.
     * @type {string}
     * @memberof ByocDeployment
     */
    deployment_type: ByocDeploymentDeploymentTypeEnum;
    /**
     * The BYOC environment where the index is hosted.
     * @type {string}
     * @memberof ByocDeployment
     */
    environment: string;
}


/**
 * @export
 */
export const ByocDeploymentDeploymentTypeEnum = {
    Byoc: 'byoc'
} as const;
export type ByocDeploymentDeploymentTypeEnum = typeof ByocDeploymentDeploymentTypeEnum[keyof typeof ByocDeploymentDeploymentTypeEnum];

/**
 * The list of collections that exist in the project.
 * @export
 * @interface CollectionList
 */
export interface CollectionList {
    /**
     * List of collections in the project
     * @type {Array<CollectionModel>}
     * @memberof CollectionList
     */
    collections?: Array<CollectionModel>;
}
/**
 * The CollectionModel describes the configuration and status of a Pinecone collection.
 * @export
 * @interface CollectionModel
 */
export interface CollectionModel {
    /**
     * The name of the collection.
     * @type {string}
     * @memberof CollectionModel
     */
    name: string;
    /**
     * The size of the collection in bytes.
     * @type {number}
     * @memberof CollectionModel
     */
    size?: number;
    /**
     * The status of the collection.
     * Possible values: `Initializing`, `Ready`, or `Terminating`.
     * @type {string}
     * @memberof CollectionModel
     */
    status: string;
    /**
     * The dimension of the vectors stored in each record held in the collection.
     * @type {number}
     * @memberof CollectionModel
     */
    dimension?: number;
    /**
     * The number of records stored in the collection.
     * @type {number}
     * @memberof CollectionModel
     */
    vector_count?: number;
    /**
     * The environment where the collection is hosted.
     * @type {string}
     * @memberof CollectionModel
     */
    environment: string;
}
/**
 * Configuration updates to apply to an existing index. All fields are optional; only the fields you include are modified.
 * - `deployment`: Update pod-based scaling parameters (`replicas`, `pod_type`).
 * 
 *   Deployment type and cloud/region cannot be changed.
 * - `schema`: Update `semantic_text` field embedding parameters. Only
 * 
 *   `write_parameters` and `read_parameters` may be changed; the model cannot
 *   be changed after creation.
 * - `read_capacity`: Update read capacity mode or dedicated node configuration
 * 
 *   for managed and BYOC indexes. Not applicable to pod-based indexes.
 * - `tags`: Update or delete index tags. Setting a tag value to `""` removes
 * 
 *   the tag.
 * - `deletion_protection`: Enable or disable deletion protection.
 * @export
 * @interface ConfigureIndexRequest
 */
export interface ConfigureIndexRequest {
    /**
     * 
     * @type {PatchIndexDeploymentRequest}
     * @memberof ConfigureIndexRequest
     */
    deployment?: PatchIndexDeploymentRequest;
    /**
     * 
     * @type {PatchIndexSchema}
     * @memberof ConfigureIndexRequest
     */
    schema?: PatchIndexSchema;
    /**
     * 
     * @type {ReadCapacity}
     * @memberof ConfigureIndexRequest
     */
    read_capacity?: ReadCapacity;
    /**
     * Custom user tags added to an index. Keys must be 80 characters or less. Values must be 120 characters or less. Keys must be alphanumeric, '_', or '-'.  Values must be alphanumeric, ';', '@', '_', '-', '.', '+', or ' '. To unset a key, set the value to be an empty string.
     * @type {{ [key: string]: string; }}
     * @memberof ConfigureIndexRequest
     */
    tags?: { [key: string]: string; };
    /**
     * Whether [deletion protection](http://docs.pinecone.io/guides/manage-data/manage-indexes#configure-deletion-protection) is enabled/disabled for the index.
     * Possible values: `disabled` or `enabled`.
     * @type {string}
     * @memberof ConfigureIndexRequest
     */
    deletion_protection?: string;
}
/**
 * The configuration needed to create a backup of an index.
 * @export
 * @interface CreateBackupRequest
 */
export interface CreateBackupRequest {
    /**
     * The name of the backup.
     * @type {string}
     * @memberof CreateBackupRequest
     */
    name?: string;
    /**
     * A description of the backup.
     * @type {string}
     * @memberof CreateBackupRequest
     */
    description?: string;
}
/**
 * The configuration needed to create a Pinecone collection.
 * @export
 * @interface CreateCollectionRequest
 */
export interface CreateCollectionRequest {
    /**
     * The name of the collection to be created. Resource name must be 1-45 characters long, start and end with an alphanumeric character, and consist only of lower case alphanumeric characters or '-'.
     * @type {string}
     * @memberof CreateCollectionRequest
     */
    name: string;
    /**
     * The name of the index to be used as the source for the collection.
     * @type {string}
     * @memberof CreateCollectionRequest
     */
    source: string;
}
/**
 * Configuration for creating an index with an integrated embedding model. The server constructs a `semantic_text` schema field named `field` using the provided model parameters.
 * @export
 * @interface CreateIndexForModelRequest
 */
export interface CreateIndexForModelRequest {
    /**
     * The name of the index. Auto-generated if not provided. Resource name must be 1-45 characters long, start and end with an alphanumeric character, and consist only of lower case alphanumeric characters or '-'. Callers that require retry-safe behavior should provide an explicit name — a duplicate request with the same name returns 409, making success detectable on retry.
     * @type {string}
     * @memberof CreateIndexForModelRequest
     */
    name?: string;
    /**
     * 
     * @type {ManagedDeployment}
     * @memberof CreateIndexForModelRequest
     */
    deployment?: ManagedDeployment;
    /**
     * The name of the schema field that will hold the embedded text. This becomes a `semantic_text` field in the index schema.
     * @type {string}
     * @memberof CreateIndexForModelRequest
     */
    field: string;
    /**
     * The name of the embedding model to use. Refer to the [model guide](https://docs.pinecone.io/guides/index-data/create-an-index#embedding-models) for available models and details.
     * @type {string}
     * @memberof CreateIndexForModelRequest
     */
    model: string;
    /**
     * The distance metric to be used for similarity search. You can use 'euclidean', 'cosine', or 'dotproduct'. If the 'vector_type' is 'sparse', the metric must be 'dotproduct'. If the `vector_type` is `dense`, the metric defaults to 'cosine'.
     * Possible values: `cosine`, `euclidean`, or `dotproduct`.
     * @type {string}
     * @memberof CreateIndexForModelRequest
     */
    metric?: string;
    /**
     * Model-specific parameters applied when embedding documents at write time.
     * @type {object}
     * @memberof CreateIndexForModelRequest
     */
    write_parameters?: object;
    /**
     * Model-specific parameters applied when embedding queries at read time.
     * @type {object}
     * @memberof CreateIndexForModelRequest
     */
    read_parameters?: object;
    /**
     * 
     * @type {ReadCapacity}
     * @memberof CreateIndexForModelRequest
     */
    read_capacity?: ReadCapacity;
    /**
     * Custom user tags added to an index. Keys must be 80 characters or less. Values must be 120 characters or less. Keys must be alphanumeric, '_', or '-'.  Values must be alphanumeric, ';', '@', '_', '-', '.', '+', or ' '. To unset a key, set the value to be an empty string.
     * @type {{ [key: string]: string; }}
     * @memberof CreateIndexForModelRequest
     */
    tags?: { [key: string]: string; };
    /**
     * Whether [deletion protection](http://docs.pinecone.io/guides/manage-data/manage-indexes#configure-deletion-protection) is enabled/disabled for the index.
     * Possible values: `disabled` or `enabled`.
     * @type {string}
     * @memberof CreateIndexForModelRequest
     */
    deletion_protection?: string;
}
/**
 * The configuration needed to create a Pinecone index from a backup.
 * @export
 * @interface CreateIndexFromBackupRequest
 */
export interface CreateIndexFromBackupRequest {
    /**
     * The name of the index. Resource name must be 1-45 characters long, start and end with an alphanumeric character, and consist only of lower case alphanumeric characters or '-'.
     * @type {string}
     * @memberof CreateIndexFromBackupRequest
     */
    name: string;
    /**
     * Custom user tags added to an index. Keys must be 80 characters or less. Values must be 120 characters or less. Keys must be alphanumeric, '_', or '-'.  Values must be alphanumeric, ';', '@', '_', '-', '.', '+', or ' '. To unset a key, set the value to be an empty string.
     * @type {{ [key: string]: string; }}
     * @memberof CreateIndexFromBackupRequest
     */
    tags?: { [key: string]: string; };
    /**
     * Whether [deletion protection](http://docs.pinecone.io/guides/manage-data/manage-indexes#configure-deletion-protection) is enabled/disabled for the index.
     * Possible values: `disabled` or `enabled`.
     * @type {string}
     * @memberof CreateIndexFromBackupRequest
     */
    deletion_protection?: string;
}
/**
 * The response for creating an index from a backup.
 * @export
 * @interface CreateIndexFromBackupResponse
 */
export interface CreateIndexFromBackupResponse {
    /**
     * The ID of the restore job that was created.
     * @type {string}
     * @memberof CreateIndexFromBackupResponse
     */
    restore_job_id: string;
    /**
     * The ID of the index that was created from the backup.
     * @type {string}
     * @memberof CreateIndexFromBackupResponse
     */
    index_id: string;
}
/**
 * The configuration needed to create a Pinecone index.
 * The `schema` field is required and defines the typed fields for the index. The `deployment` field selects infrastructure and defaults to managed (serverless) on AWS `us-east-1` if omitted. The `name` is auto-generated if not provided.
 * @export
 * @interface CreateIndexRequest
 */
export interface CreateIndexRequest {
    /**
     * The name of the index. Must be unique within the project. Resource name must be 1-45 characters long, start and end with an alphanumeric character, and consist only of lower case alphanumeric characters or '-'. If not provided, a name is generated automatically. Callers that require retry-safe behavior should provide an explicit name — a duplicate request with the same name returns 409, making success detectable on retry.
     * @type {string}
     * @memberof CreateIndexRequest
     */
    name?: string;
    /**
     * 
     * @type {IndexDeploymentRequest}
     * @memberof CreateIndexRequest
     */
    deployment?: IndexDeploymentRequest;
    /**
     * 
     * @type {CreateIndexSchema}
     * @memberof CreateIndexRequest
     */
    schema: CreateIndexSchema;
    /**
     * The name of a collection from which to create the index. The collection must have been created from a pod-based index with a compatible schema.
     * @type {string}
     * @memberof CreateIndexRequest
     */
    source_collection?: string;
    /**
     * The ID of a backup from which to restore the index. Mutually exclusive with `source_collection`.
     * @type {string}
     * @memberof CreateIndexRequest
     */
    source_backup_id?: string;
    /**
     * The ID of a customer-managed encryption key (CMEK) to use for this index. Requires CMEK to be enabled for your organization.
     * @type {string}
     * @memberof CreateIndexRequest
     */
    cmek_id?: string;
    /**
     * 
     * @type {ReadCapacity}
     * @memberof CreateIndexRequest
     */
    read_capacity?: ReadCapacity;
    /**
     * Custom user tags added to an index. Keys must be 80 characters or less. Values must be 120 characters or less. Keys must be alphanumeric, '_', or '-'.  Values must be alphanumeric, ';', '@', '_', '-', '.', '+', or ' '. To unset a key, set the value to be an empty string.
     * @type {{ [key: string]: string; }}
     * @memberof CreateIndexRequest
     */
    tags?: { [key: string]: string; };
    /**
     * Whether [deletion protection](http://docs.pinecone.io/guides/manage-data/manage-indexes#configure-deletion-protection) is enabled/disabled for the index.
     * Possible values: `disabled` or `enabled`.
     * @type {string}
     * @memberof CreateIndexRequest
     */
    deletion_protection?: string;
}
/**
 * The schema to use when creating a Pinecone index. Defines the typed fields that documents in the index can contain, including vector fields, semantic text fields, and metadata fields.
 * At least one primary field (`dense_vector`, `sparse_vector`, `semantic_text`, or a `string` field with `full_text_search`) must be present.
 * @export
 * @interface CreateIndexSchema
 */
export interface CreateIndexSchema {
    /**
     * A map of field names to their configurations. Field names must be unique, non-empty strings and must not use the reserved names `_id`, `_values`, or `_sparse_values`.
     * @type {{ [key: string]: CreateIndexSchemaField; }}
     * @memberof CreateIndexSchema
     */
    fields: { [key: string]: CreateIndexSchemaField; };
}
/**
 * @type CreateIndexSchemaField
 * The configuration of a single field in the index schema at creation time. The `type` property determines how the field is stored and searched.
 * Supported field types:
 * - `dense_vector`: Fixed-dimension floating-point vectors for ANN search. - `sparse_vector`: Sparse vectors for keyword or hybrid search. - `semantic_text`: Text field backed by an integrated embedding model. - `string`: String field for full-text search (use `full_text_search` object)
 * 
 *   or metadata filtering (use `filterable`).
 * - `string_list`: String array field for metadata filtering. - `float`: Numeric field for metadata filtering. Also accepts `"number"` as the type value. - `boolean`: Boolean field for metadata filtering.
 * Schema constraints enforced at creation time:
 * - At most one `dense_vector` field. - At most one `sparse_vector` field. - At most one `semantic_text` field; `semantic_text` cannot be combined with
 * 
 *   `dense_vector`, `sparse_vector`, or full-text search string fields.
 * - At least one primary field (`dense_vector`, `sparse_vector`, `semantic_text`,
 * 
 *   or a `string` field with `full_text_search`) must be present.
 * @export
 */
export type CreateIndexSchemaField = { type: 'boolean' } & BooleanField | { type: 'dense_vector' } & DenseVectorField | { type: 'float' } & FloatField | { type: 'semantic_text' } & SemanticTextField | { type: 'sparse_vector' } & SparseVectorField | { type: 'string' } & StringField | { type: 'string_list' } & StringListField;
/**
 * A dense vector field configuration. Stores fixed-dimension floating-point vectors for approximate nearest-neighbor (ANN) search.
 * @export
 * @interface DenseVectorField
 */
export interface DenseVectorField {
    /**
     * Identifies this as a dense vector field. Must be `dense_vector`.
     * @type {string}
     * @memberof DenseVectorField
     */
    type: DenseVectorFieldTypeEnum;
    /**
     * The number of dimensions in the dense vectors stored in this field.
     * @type {number}
     * @memberof DenseVectorField
     */
    dimension: number;
    /**
     * The distance metric used for similarity search.
     * Possible values: `cosine`, `dotproduct`, or `euclidean`.
     * @type {string}
     * @memberof DenseVectorField
     */
    metric: string;
}


/**
 * @export
 */
export const DenseVectorFieldTypeEnum = {
    DenseVector: 'dense_vector',
    SparseVector: 'sparse_vector',
    SemanticText: 'semantic_text',
    String: 'string',
    StringList: 'string_list',
    Float: 'float',
    Boolean: 'boolean'
} as const;
export type DenseVectorFieldTypeEnum = typeof DenseVectorFieldTypeEnum[keyof typeof DenseVectorFieldTypeEnum];

/**
 * The response shape used for all error responses.
 * @export
 * @interface ErrorResponse
 */
export interface ErrorResponse {
    /**
     * The HTTP status code of the error.
     * @type {number}
     * @memberof ErrorResponse
     */
    status: number;
    /**
     * 
     * @type {ErrorResponseError}
     * @memberof ErrorResponse
     */
    error: ErrorResponseError;
}
/**
 * Detailed information about the error that occurred.
 * @export
 * @interface ErrorResponseError
 */
export interface ErrorResponseError {
    /**
     * The error code.
     * Possible values: `OK`, `UNKNOWN`, `INVALID_ARGUMENT`, `DEADLINE_EXCEEDED`, `QUOTA_EXCEEDED`, `NOT_FOUND`, `ALREADY_EXISTS`, `PERMISSION_DENIED`, `UNAUTHENTICATED`, `RESOURCE_EXHAUSTED`, `FAILED_PRECONDITION`, `ABORTED`, `OUT_OF_RANGE`, `UNIMPLEMENTED`, `INTERNAL`, `UNAVAILABLE`, `DATA_LOSS`, `FORBIDDEN`, `UNPROCESSABLE_ENTITY`, or `PAYMENT_REQUIRED`.
     * @type {string}
     * @memberof ErrorResponseError
     */
    code: string;
    /**
     * A human-readable description of the error
     * @type {string}
     * @memberof ErrorResponseError
     */
    message: string;
    /**
     * Additional information about the error. This field is not guaranteed to be present.
     * @type {object}
     * @memberof ErrorResponseError
     */
    details?: object;
}
/**
 * A numeric (floating-point) field configuration. Can be indexed for use in metadata filter expressions.
 * @export
 * @interface FloatField
 */
export interface FloatField {
    /**
     * Identifies this as a float field. Must be `float`.
     * @type {string}
     * @memberof FloatField
     */
    type: FloatFieldTypeEnum;
    /**
     * Optional description for this field.
     * @type {string}
     * @memberof FloatField
     */
    description?: string;
    /**
     * Whether this field should be indexed for use in filter expressions.
     * @type {boolean}
     * @memberof FloatField
     */
    filterable?: boolean;
}


/**
 * @export
 */
export const FloatFieldTypeEnum = {
    Float: 'float'
} as const;
export type FloatFieldTypeEnum = typeof FloatFieldTypeEnum[keyof typeof FloatFieldTypeEnum];

/**
 * @type IndexDeployment
 * The deployment configuration of a Pinecone index. The `deployment_type` field indicates which infrastructure model the index uses.
 * - `pod`: Dedicated pod-based infrastructure. Suitable for workloads that
 * 
 *   require predictable performance.
 * - `managed`: Serverless infrastructure managed by Pinecone, including
 * 
 *   full-text search indexes. Scales automatically; billed per usage.
 * - `byoc`: Bring-your-own-compute. Runs in customer-managed infrastructure.
 * @export
 */
export type IndexDeployment = { deployment_type: 'byoc' } & ByocDeployment | { deployment_type: 'managed' } & ManagedDeployment | { deployment_type: 'pod' } & PodDeployment;
/**
 * @type IndexDeploymentRequest
 * The deployment configuration for index creation. The `deployment_type` field selects the infrastructure model. Defaults to `managed` (serverless) in `us-east-1` on `aws` if omitted.
 * - `pod`: Dedicated pod-based infrastructure. - `managed`: Serverless infrastructure managed by Pinecone, including
 * 
 *   full-text search indexes.
 * - `byoc`: Bring-your-own-compute.
 * @export
 */
export type IndexDeploymentRequest = { deployment_type: 'byoc' } & ByocDeployment | { deployment_type: 'managed' } & ManagedDeployment | { deployment_type: 'pod' } & PodDeployment;
/**
 * The list of indexes that exist in the project.
 * @export
 * @interface IndexList
 */
export interface IndexList {
    /**
     * List of indexes in the project
     * @type {Array<IndexModel>}
     * @memberof IndexList
     */
    indexes?: Array<IndexModel>;
}
/**
 * The IndexModel describes the configuration and status of a Pinecone index.
 * @export
 * @interface IndexModel
 */
export interface IndexModel {
    /**
     * The name of the index. Resource name must be 1-45 characters long, start and end with an alphanumeric character, and consist only of lower case alphanumeric characters or '-'.
     * @type {string}
     * @memberof IndexModel
     */
    name: string;
    /**
     * The URL address where the index is hosted.
     * @type {string}
     * @memberof IndexModel
     */
    host: string;
    /**
     * The private endpoint URL of an index.
     * @type {string}
     * @memberof IndexModel
     */
    private_host?: string;
    /**
     * 
     * @type {IndexModelStatus}
     * @memberof IndexModel
     */
    status: IndexModelStatus;
    /**
     * 
     * @type {IndexDeployment}
     * @memberof IndexModel
     */
    deployment: IndexDeployment;
    /**
     * 
     * @type {ReadCapacityResponse}
     * @memberof IndexModel
     */
    read_capacity?: ReadCapacityResponse;
    /**
     * The name of the collection this index was created from, if any.
     * @type {string}
     * @memberof IndexModel
     */
    source_collection?: string;
    /**
     * The ID of the backup this index was restored from, if any.
     * @type {string}
     * @memberof IndexModel
     */
    source_backup_id?: string;
    /**
     * The ID of the customer-managed encryption key (CMEK) used to encrypt this index, if any.
     * @type {string}
     * @memberof IndexModel
     */
    cmek_id?: string;
    /**
     * 
     * @type {IndexSchema}
     * @memberof IndexModel
     */
    schema: IndexSchema;
    /**
     * Custom user tags added to an index. Keys must be 80 characters or less. Values must be 120 characters or less. Keys must be alphanumeric, '_', or '-'.  Values must be alphanumeric, ';', '@', '_', '-', '.', '+', or ' '. To unset a key, set the value to be an empty string.
     * @type {{ [key: string]: string; }}
     * @memberof IndexModel
     */
    tags?: { [key: string]: string; };
    /**
     * Whether [deletion protection](http://docs.pinecone.io/guides/manage-data/manage-indexes#configure-deletion-protection) is enabled/disabled for the index.
     * Possible values: `disabled` or `enabled`.
     * @type {string}
     * @memberof IndexModel
     */
    deletion_protection: string;
}
/**
 * The current status of the index.
 * @export
 * @interface IndexModelStatus
 */
export interface IndexModelStatus {
    /**
     * Whether the index is ready for use.
     * @type {boolean}
     * @memberof IndexModelStatus
     */
    ready: boolean;
    /**
     * The current state of the index.
     * Possible values: `Initializing`, `InitializationFailed`, `ScalingUp`, `ScalingDown`, `ScalingUpPodSize`, `ScalingDownPodSize`, `Terminating`, `Ready`, or `Disabled`.
     * @type {string}
     * @memberof IndexModelStatus
     */
    state: string;
}
/**
 * The schema of a Pinecone index. The schema defines the typed fields that documents in the index can contain, including vector fields, semantic text fields, and metadata fields.
 * @export
 * @interface IndexSchema
 */
export interface IndexSchema {
    /**
     * A map of field names to their configurations. Field names must be unique, non-empty strings and must not use the reserved names `_id`, `_values`, or `_sparse_values`.
     * @type {{ [key: string]: IndexSchemaField; }}
     * @memberof IndexSchema
     */
    fields: { [key: string]: IndexSchemaField; };
}
/**
 * @type IndexSchemaField
 * The configuration of a single field in the index schema. The `type` property determines how the field is stored and searched.
 * Supported field types:
 * - `dense_vector`: Fixed-dimension floating-point vectors for ANN search. - `sparse_vector`: Sparse vectors for keyword or hybrid search. - `semantic_text`: Text field backed by an integrated embedding model. - `string`: String field for full-text search or metadata filtering. - `string_list`: String array field for metadata filtering. - `float`: Numeric field for metadata filtering. - `boolean`: Boolean field for metadata filtering.
 * @export
 */
export type IndexSchemaField = { type: 'boolean' } & BooleanField | { type: 'dense_vector' } & DenseVectorField | { type: 'float' } & FloatField | { type: 'semantic_text' } & SemanticTextField | { type: 'sparse_vector' } & SparseVectorField | { type: 'string' } & StringField | { type: 'string_list' } & StringListField;
/**
 * Deployment configuration for a serverless (managed) index. Serverless indexes scale automatically and you are billed only for the resources you use. This deployment type also covers full-text search indexes, which are serverless under the hood.
 * @export
 * @interface ManagedDeployment
 */
export interface ManagedDeployment {
    /**
     * Identifies this as a managed (serverless) deployment. Must be `managed`.
     * @type {string}
     * @memberof ManagedDeployment
     */
    deployment_type: ManagedDeploymentDeploymentTypeEnum;
    /**
     * The public cloud where the index is hosted.
     * Possible values: `gcp`, `aws`, or `azure`.
     * @type {string}
     * @memberof ManagedDeployment
     */
    cloud: string;
    /**
     * The region where the index is hosted.
     * @type {string}
     * @memberof ManagedDeployment
     */
    region: string;
}


/**
 * @export
 */
export const ManagedDeploymentDeploymentTypeEnum = {
    Managed: 'managed'
} as const;
export type ManagedDeploymentDeploymentTypeEnum = typeof ManagedDeploymentDeploymentTypeEnum[keyof typeof ManagedDeploymentDeploymentTypeEnum];

/**
 * The pagination object that is returned with paginated responses.
 * @export
 * @interface PaginationResponse
 */
export interface PaginationResponse {
    /**
     * The token to use to retrieve the next page of results.
     * @type {string}
     * @memberof PaginationResponse
     */
    next: string;
}
/**
 * Deployment update parameters for pod-based indexes. Specify `replicas`, `pod_type`, or both. Deployment type, cloud/region, and environment cannot be changed after creation. Do not include a `deployment_type` field; it is not accepted.
 * @export
 * @interface PatchIndexDeploymentRequest
 */
export interface PatchIndexDeploymentRequest {
    /**
     * The number of replicas. Replicas duplicate your index. They provide higher availability and throughput. Replicas can be scaled up or down as your needs change.
     * @type {number}
     * @memberof PatchIndexDeploymentRequest
     */
    replicas?: number;
    /**
     * The type of pod to use. One of `s1`, `p1`, or `p2` appended with `.` and one of `x1`, `x2`, `x4`, or `x8`.
     * @type {string}
     * @memberof PatchIndexDeploymentRequest
     */
    pod_type?: string;
}
/**
 * Schema updates to apply to an existing index. Only `semantic_text` field parameters can be updated after index creation. The model itself cannot be changed once set; only `write_parameters` and `read_parameters` may be updated if the model stays the same.
 * @export
 * @interface PatchIndexSchema
 */
export interface PatchIndexSchema {
    /**
     * A map of semantic text field names to their updated parameters. Only fields of type `semantic_text` may be specified.
     * @type {{ [key: string]: PatchSemanticTextField; }}
     * @memberof PatchIndexSchema
     */
    fields: { [key: string]: PatchSemanticTextField; };
}
/**
 * Updated parameters for a semantic text field.
 * @export
 * @interface PatchSemanticTextField
 */
export interface PatchSemanticTextField {
    /**
     * The field type. Must be `semantic_text`.
     * @type {string}
     * @memberof PatchSemanticTextField
     */
    type: PatchSemanticTextFieldTypeEnum;
    /**
     * The name of the embedding model. Cannot be changed once set; only specify to confirm the current model when also updating parameters.
     * @type {string}
     * @memberof PatchSemanticTextField
     */
    model?: string;
    /**
     * Updated model-specific parameters applied at write time.
     * @type {object}
     * @memberof PatchSemanticTextField
     */
    write_parameters?: object;
    /**
     * Updated model-specific parameters applied at query time.
     * @type {object}
     * @memberof PatchSemanticTextField
     */
    read_parameters?: object;
}


/**
 * @export
 */
export const PatchSemanticTextFieldTypeEnum = {
    SemanticText: 'semantic_text'
} as const;
export type PatchSemanticTextFieldTypeEnum = typeof PatchSemanticTextFieldTypeEnum[keyof typeof PatchSemanticTextFieldTypeEnum];

/**
 * Deployment configuration for a pod-based index.
 * @export
 * @interface PodDeployment
 */
export interface PodDeployment {
    /**
     * Identifies this as a pod-based deployment. Must be `pod`.
     * @type {string}
     * @memberof PodDeployment
     */
    deployment_type: PodDeploymentDeploymentTypeEnum;
    /**
     * The environment where the index is hosted.
     * @type {string}
     * @memberof PodDeployment
     */
    environment: string;
    /**
     * The number of replicas. Replicas duplicate your index. They provide higher availability and throughput. Replicas can be scaled up or down as your needs change.
     * @type {number}
     * @memberof PodDeployment
     */
    replicas?: number;
    /**
     * The number of shards. Shards split your data across multiple pods so you can fit more data into an index.
     * @type {number}
     * @memberof PodDeployment
     */
    shards?: number;
    /**
     * The type of pod to use. One of `s1`, `p1`, or `p2` appended with `.` and one of `x1`, `x2`, `x4`, or `x8`.
     * @type {string}
     * @memberof PodDeployment
     */
    pod_type: string;
}


/**
 * @export
 */
export const PodDeploymentDeploymentTypeEnum = {
    Pod: 'pod'
} as const;
export type PodDeploymentDeploymentTypeEnum = typeof PodDeploymentDeploymentTypeEnum[keyof typeof PodDeploymentDeploymentTypeEnum];

/**
 * @type ReadCapacity
 * By default the index will be created with read capacity  mode `OnDemand`. If you prefer to allocate dedicated read  nodes for your workload, you must specify mode `Dedicated` and additional configurations for `node_type` and `scaling`.
 * @export
 */
export type ReadCapacity = { mode: 'Dedicated' } & ReadCapacityDedicatedSpec | { mode: 'OnDemand' } & ReadCapacityOnDemandSpec;
/**
 * Configuration for dedicated read capacity. See  [this guide](https://docs.pinecone.io/guides/index-data/dedicated-read-nodes) for more details on  how to configure dedicated read capacity.
 * @export
 * @interface ReadCapacityDedicatedConfig
 */
export interface ReadCapacityDedicatedConfig {
    /**
     * The type of machines to use. Available options: `b1` and `t1`. `t1` includes increased processing power and memory.
     * @type {string}
     * @memberof ReadCapacityDedicatedConfig
     */
    node_type?: string;
    /**
     * The type of scaling strategy to use.
     * @type {string}
     * @memberof ReadCapacityDedicatedConfig
     */
    scaling?: string;
    /**
     * 
     * @type {ScalingConfigManual}
     * @memberof ReadCapacityDedicatedConfig
     */
    manual?: ScalingConfigManual;
}
/**
 * 
 * @export
 * @interface ReadCapacityDedicatedSpec
 */
export interface ReadCapacityDedicatedSpec {
    [key: string]: any | any;
    /**
     * The mode of the index. Possible values: `OnDemand` or `Dedicated`. Defaults to `OnDemand`. If set to `Dedicated`, `dedicated.node_type`, and `dedicated.scaling` must be specified.
     * @type {string}
     * @memberof ReadCapacityDedicatedSpec
     */
    mode: string;
    /**
     * 
     * @type {ReadCapacityDedicatedConfig}
     * @memberof ReadCapacityDedicatedSpec
     */
    dedicated: ReadCapacityDedicatedConfig;
}
/**
 * 
 * @export
 * @interface ReadCapacityDedicatedSpecResponse
 */
export interface ReadCapacityDedicatedSpecResponse {
    /**
     * The mode of the index. Possible values: `OnDemand` or `Dedicated`. Defaults to `OnDemand`. If set to `Dedicated`, `dedicated.node_type`, and `dedicated.scaling` must be specified.
     * @type {string}
     * @memberof ReadCapacityDedicatedSpecResponse
     */
    mode: string;
    /**
     * 
     * @type {ReadCapacityDedicatedConfig}
     * @memberof ReadCapacityDedicatedSpecResponse
     */
    dedicated: ReadCapacityDedicatedConfig;
    /**
     * 
     * @type {ReadCapacityStatus}
     * @memberof ReadCapacityDedicatedSpecResponse
     */
    status: ReadCapacityStatus;
}
/**
 * 
 * @export
 * @interface ReadCapacityOnDemandSpec
 */
export interface ReadCapacityOnDemandSpec {
    /**
     * The mode of the index. Possible values: `OnDemand` or `Dedicated`. Defaults to `OnDemand`. If set to `Dedicated`, `dedicated.node_type`, and `dedicated.scaling` must be specified.
     * @type {string}
     * @memberof ReadCapacityOnDemandSpec
     */
    mode: string;
}
/**
 * 
 * @export
 * @interface ReadCapacityOnDemandSpecResponse
 */
export interface ReadCapacityOnDemandSpecResponse {
    /**
     * The mode of the index. Possible values: `OnDemand` or `Dedicated`. Defaults to `OnDemand`. If set to `Dedicated`, `dedicated.node_type`, and `dedicated.scaling` must be specified.
     * @type {string}
     * @memberof ReadCapacityOnDemandSpecResponse
     */
    mode: string;
    /**
     * 
     * @type {ReadCapacityStatus}
     * @memberof ReadCapacityOnDemandSpecResponse
     */
    status: ReadCapacityStatus;
}
/**
 * @type ReadCapacityResponse
 * Response containing read capacity configuration
 * @export
 */
export type ReadCapacityResponse = { mode: 'Dedicated' } & ReadCapacityDedicatedSpecResponse | { mode: 'OnDemand' } & ReadCapacityOnDemandSpecResponse;
/**
 * The current status of factors affecting the read capacity of a serverless index
 * @export
 * @interface ReadCapacityStatus
 */
export interface ReadCapacityStatus {
    /**
     * The `state` describes the overall status of factors relating to the read capacity of an index. 
     * 
     * Available values:
     * - `Ready` is the state most of the time
     * - `Scaling` if the number of replicas or shards has been recently updated by calling the [configure index endpoint](https://docs.pinecone.io/reference/api/2026-04/control-plane/configure_index)
     * - `Migrating` if the index is being migrated to a new `node_type`
     * - `Error` if there is an error with the read capacity configuration. In that case, see `error_message` for more details.
     * @type {string}
     * @memberof ReadCapacityStatus
     */
    state: string;
    /**
     * The number of replicas. Each replica has dedicated  compute resources and data storage. Increasing this number  will increase the total throughput of the index.
     * @type {number}
     * @memberof ReadCapacityStatus
     */
    current_replicas?: number;
    /**
     * The number of shards. Each shard has dedicated storage.  Increasing shards alleiviates index fullness. 
     * @type {number}
     * @memberof ReadCapacityStatus
     */
    current_shards?: number;
    /**
     * An optional error message indicating any issues with your read capacity configuration
     * @type {string}
     * @memberof ReadCapacityStatus
     */
    error_message?: string;
}
/**
 * The list of restore jobs that exist in the project.
 * @export
 * @interface RestoreJobList
 */
export interface RestoreJobList {
    /**
     * List of restore job objects
     * @type {Array<RestoreJobModel>}
     * @memberof RestoreJobList
     */
    data: Array<RestoreJobModel>;
    /**
     * 
     * @type {PaginationResponse}
     * @memberof RestoreJobList
     */
    pagination?: PaginationResponse;
}
/**
 * The RestoreJobModel describes the status of a restore job.
 * @export
 * @interface RestoreJobModel
 */
export interface RestoreJobModel {
    /**
     * Unique identifier for the restore job
     * @type {string}
     * @memberof RestoreJobModel
     */
    restore_job_id: string;
    /**
     * Backup used for the restore
     * @type {string}
     * @memberof RestoreJobModel
     */
    backup_id: string;
    /**
     * Name of the index into which data is being restored
     * @type {string}
     * @memberof RestoreJobModel
     */
    target_index_name: string;
    /**
     * ID of the index
     * @type {string}
     * @memberof RestoreJobModel
     */
    target_index_id: string;
    /**
     * Status of the restore job
     * @type {string}
     * @memberof RestoreJobModel
     */
    status: string;
    /**
     * Timestamp when the restore job started
     * @type {string}
     * @memberof RestoreJobModel
     */
    created_at: string;
    /**
     * Timestamp when the restore job finished
     * @type {string}
     * @memberof RestoreJobModel
     */
    completed_at?: string;
    /**
     * The progress made by the restore job out of 100
     * @type {number}
     * @memberof RestoreJobModel
     */
    percent_complete?: number;
}
/**
 * The config to use for manual read capacity scaling.
 * @export
 * @interface ScalingConfigManual
 */
export interface ScalingConfigManual {
    /**
     * The number of replicas to use. Replicas duplicate the compute resources and data of an index, allowing higher query throughput and availability. Setting replicas to 0 disables the index but can be used to reduce costs while usage is paused.
     * @type {number}
     * @memberof ScalingConfigManual
     */
    replicas?: number;
    /**
     * The number of shards to use. Shards determine the storage capacity of an index, with each shard providing 250 GB of storage.
     * @type {number}
     * @memberof ScalingConfigManual
     */
    shards?: number;
}
/**
 * A semantic text field configuration. Backed by an integrated embedding model that embeds text at write and query time, enabling semantic similarity search without separate embedding calls.
 * @export
 * @interface SemanticTextField
 */
export interface SemanticTextField {
    /**
     * Identifies this as a semantic text field. Must be `semantic_text`.
     * @type {string}
     * @memberof SemanticTextField
     */
    type: SemanticTextFieldTypeEnum;
    /**
     * The name of the integrated embedding model to use for this field.
     * @type {string}
     * @memberof SemanticTextField
     */
    model: string;
    /**
     * The distance metric used for similarity search. Defaults to the model's preferred metric if not specified.
     * Possible values: `cosine`, `dotproduct`, or `euclidean`.
     * @type {string}
     * @memberof SemanticTextField
     */
    metric?: string;
    /**
     * Model-specific parameters applied at write time, such as `input_type`.
     * @type {object}
     * @memberof SemanticTextField
     */
    write_parameters?: object;
    /**
     * Model-specific parameters applied at query time, such as `input_type`.
     * @type {object}
     * @memberof SemanticTextField
     */
    read_parameters?: object;
}


/**
 * @export
 */
export const SemanticTextFieldTypeEnum = {
    SemanticText: 'semantic_text'
} as const;
export type SemanticTextFieldTypeEnum = typeof SemanticTextFieldTypeEnum[keyof typeof SemanticTextFieldTypeEnum];

/**
 * A sparse vector field configuration. Stores sparse vectors for keyword or hybrid search.
 * @export
 * @interface SparseVectorField
 */
export interface SparseVectorField {
    /**
     * Identifies this as a sparse vector field. Must be `sparse_vector`.
     * @type {string}
     * @memberof SparseVectorField
     */
    type: SparseVectorFieldTypeEnum;
}


/**
 * @export
 */
export const SparseVectorFieldTypeEnum = {
    SparseVector: 'sparse_vector'
} as const;
export type SparseVectorFieldTypeEnum = typeof SparseVectorFieldTypeEnum[keyof typeof SparseVectorFieldTypeEnum];

/**
 * A string field configuration. A string field operates in one of two mutually exclusive modes:
 * - **Full-text search mode**: Include a `full_text_search` object. The field
 * 
 *   is indexed for full-text search using the specified text-analysis settings.
 * - **Metadata filtering mode**: Set `filterable: true` (or omit `full_text_search`).
 * 
 *   The field is indexed for use in filter expressions.
 * 
 * Providing both `full_text_search` and `filterable` in the same field definition is not allowed and will be rejected.
 * @export
 * @interface StringField
 */
export interface StringField {
    /**
     * Identifies this as a string field. Must be `string`.
     * @type {string}
     * @memberof StringField
     */
    type: StringFieldTypeEnum;
    /**
     * Optional description for this field.
     * @type {string}
     * @memberof StringField
     */
    description?: string;
    /**
     * 
     * @type {StringFieldFullTextSearch}
     * @memberof StringField
     */
    full_text_search?: StringFieldFullTextSearch;
    /**
     * Whether this field should be indexed for use in filter expressions. Mutually exclusive with `full_text_search`.
     * @type {boolean}
     * @memberof StringField
     */
    filterable?: boolean;
}


/**
 * @export
 */
export const StringFieldTypeEnum = {
    String: 'string'
} as const;
export type StringFieldTypeEnum = typeof StringFieldTypeEnum[keyof typeof StringFieldTypeEnum];

/**
 * Full-text search configuration. When present, the field is indexed for full-text search. Mutually exclusive with `filterable`.
 * `stop_words` requires `stemming: true`.
 * @export
 * @interface StringFieldFullTextSearch
 */
export interface StringFieldFullTextSearch {
    /**
     * The language for text analysis. Defaults to `en` if not specified.
     * @type {string}
     * @memberof StringFieldFullTextSearch
     */
    language?: string;
    /**
     * Whether to apply stemming during text analysis. Defaults to `false`.
     * @type {boolean}
     * @memberof StringFieldFullTextSearch
     */
    stemming?: boolean;
    /**
     * Whether to filter stop words during text analysis. Requires `stemming: true`. Defaults to `false`.
     * @type {boolean}
     * @memberof StringFieldFullTextSearch
     */
    stop_words?: boolean;
    /**
     * Whether to lowercase tokens during text analysis. Defaults to `true`. Read-only; set by the server.
     * @type {boolean}
     * @memberof StringFieldFullTextSearch
     */
    readonly lowercase?: boolean;
    /**
     * The maximum token length to index. Tokens exceeding this length are truncated. Defaults to `40`. Read-only; set by the server.
     * @type {number}
     * @memberof StringFieldFullTextSearch
     */
    readonly max_term_len?: number;
}
/**
 * A string array field configuration. Stores arrays of strings and can be indexed for use in metadata filter expressions.
 * @export
 * @interface StringListField
 */
export interface StringListField {
    /**
     * Identifies this as a string array field. Must be `string_list`.
     * @type {string}
     * @memberof StringListField
     */
    type: StringListFieldTypeEnum;
    /**
     * Optional description for this field.
     * @type {string}
     * @memberof StringListField
     */
    description?: string;
    /**
     * Whether this field should be indexed for use in filter expressions.
     * @type {boolean}
     * @memberof StringListField
     */
    filterable?: boolean;
}


/**
 * @export
 */
export const StringListFieldTypeEnum = {
    StringList: 'string_list'
} as const;
export type StringListFieldTypeEnum = typeof StringListFieldTypeEnum[keyof typeof StringListFieldTypeEnum];

