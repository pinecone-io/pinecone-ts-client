import type {
  ManageIndexesApi,
  CreateIndexRequest,
  DenseVectorField,
  SparseVectorField,
  StringField,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import { pollUntilIndexIsReady } from '../../utils';
import { translateLegacyCreateOptions } from './legacyTranslation';
import type { LegacyCreateIndexOptions } from './legacyTypes';
import type { IndexModel } from './listIndexes';
import type { ReadCapacity, DeletionProtection, IndexMetric } from '../types';

// Re-export generated types for indexes
export type {
  IndexDeploymentRequest,
  IndexDeployment,
  ManagedDeployment,
  ByocDeployment,
  PodDeployment,
  BooleanField,
  DenseVectorField,
  FloatField,
  SemanticTextField,
  SparseVectorField,
  StringField,
  StringListField,
  StringFieldFullTextSearch,
  StringFieldFullTextSearchNgram,
} from '../../pinecone-generated-ts-fetch/db_control';

// Re-export read capacity types, shared with `configureIndex`,
// `createIndexForModel`, and `createIndexFromBackup`.
export type {
  ReadCapacity,
  ReadCapacityOnDemand,
  ReadCapacityDedicated,
  ReadCapacityDedicatedSettings,
  ScalingConfigManualInput,
  DedicatedNodeType,
  ReadCapacityScaling,
} from '../types';

/**
 * A `string` field indexed for full-text search.
 *
 * `fullTextSearch` is what makes the field searchable, so it is required. Pass
 * an empty object to accept the text analysis defaults, or set options explicitly.
 *
 * ```typescript
 * import type { FullTextSearchStringField } from '@pinecone-database/pinecone';
 *
 * const field: FullTextSearchStringField = {
 *   type: 'string',
 *   fullTextSearch: {},
 * };
 * ```
 */
export type FullTextSearchStringField = StringField;

/**
 * The configuration of a single field in the schema of a new index.
 *
 * A schema declares the searchable fields of the index. One of three creatable
 * field types:
 *
 * - `dense_vector` — fixed-dimension vectors for semantic search.
 * - `sparse_vector` — sparse vectors for keyword or hybrid search.
 * - `string` with `fullTextSearch` — see {@link FullTextSearchStringField}.
 *
 * A `semantic_text` field — text embedded by an integrated model — cannot be
 * declared here. Use {@link Indexes.createForModel} instead, which builds the
 * field from the model parameters you supply. `semantic_text` still appears on
 * the schema of an index you describe, as one of the {@link IndexSchemaField}
 * types.
 *
 * Values you only need to filter on — numbers, booleans, string lists, and
 * plain strings — do not belong in the schema. Send them as document metadata
 * instead: they are indexed automatically at upsert time and appear on the
 * described index's {@link IndexSchema}.
 *
 * @see [Create an index](https://docs.pinecone.io/guides/index-data/create-an-index)
 */
export type CreateIndexSchemaField =
  // `type` re-narrowed: the generated DenseVectorField accepts any field type.
  | (DenseVectorField & {
      /** Field kind used to narrow this schema variant. */
      type: 'dense_vector';
      /** Similarity metric used by the dense vector field. */
      metric: IndexMetric;
    })
  | SparseVectorField
  | FullTextSearchStringField;

/**
 * The schema of a new index: a map of field names to their configurations.
 *
 * Field names must be unique, non-empty strings, and cannot use the reserved
 * name `_id`. A schema containing only reserved `_values` or `_sparse_values`
 * fields selects the vectors API and supports legacy vector operations.
 *
 * @see [Create an index](https://docs.pinecone.io/guides/index-data/create-an-index)
 */
export interface CreateIndexSchema {
  /** Map of field names to their schema configurations. */
  fields: { [fieldName: string]: CreateIndexSchemaField };
}

/**
 * Options for creating a schema-based index.
 *
 */
export interface NativeCreateIndexOptions extends Omit<
  CreateIndexRequest,
  'name' | 'schema' | 'readCapacity' | 'deletionProtection'
> {
  /** The name of the index to create. Must be unique within the project. */
  name: string;
  /** The typed fields stored in each document. See {@link CreateIndexSchema}. */
  schema: CreateIndexSchema;
  /** @deprecated Use schema fields. */
  dimension?: never;
  /** @deprecated Use schema fields. */
  metric?: never;
  /** @deprecated Use schema fields. */
  vectorType?: never;
  /** @deprecated Use deployment. */
  spec?: never;
  /**
   * The read capacity configuration for the index. Omit for on-demand capacity.
   */
  readCapacity?: ReadCapacity;
  /** Whether to enable deletion protection. Defaults to `disabled`. */
  deletionProtection?: DeletionProtection;
  /**
   * When true, polls until the index is ready before returning.
   */
  waitUntilReady?: boolean;
  /**
   * Maximum time in milliseconds to wait for the index to become ready when
   * `waitUntilReady` is `true`. Omit to poll indefinitely.
   * Throws {@link Errors.PineconeTimeoutError} if the deadline is exceeded.
   */
  timeout?: number;
  /**
   * When true, returns `undefined` instead of throwing if an index with this
   * name already exists. Otherwise creation always returns an index model,
   * regardless of `waitUntilReady`.
   */
  suppressConflicts?: boolean;
}

/** Options for creating either a schema-based or a classic vector index. */
export type CreateIndexOptions =
  NativeCreateIndexOptions | LegacyCreateIndexOptions;
export type {
  LegacyCreateIndexOptions,
  LegacyCreateIndexSpec,
  CreateIndexSpec,
  CreateIndexServerlessSpec,
  CreateIndexByocSpec,
  CreateIndexPodSpec,
  CreateIndexReadCapacity,
  ReadCapacityOnDemandParams,
  ReadCapacityDedicatedParams,
} from './legacyTypes';

/**
 * Creates a schema-based index.
 */
export function createIndex(
  api: ManageIndexesApi,
  options: CreateIndexOptions & { suppressConflicts?: false },
): Promise<IndexModel>;
export function createIndex(
  api: ManageIndexesApi,
  options: CreateIndexOptions,
): Promise<IndexModel | void>;
export async function createIndex(
  api: ManageIndexesApi,
  options: CreateIndexOptions,
): Promise<IndexModel | void> {
  const normalized = translateLegacyCreateOptions(options);
  if (!normalized.name) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `name` in order to create an index.',
    );
  }
  if (!normalized.schema) {
    throw new PineconeArgumentError(
      'You must pass a `schema` object in order to create an index.',
    );
  }

  const { waitUntilReady, timeout, suppressConflicts, ...createRequest } =
    normalized;

  try {
    const result = await api.createIndex({
      createIndexRequest: createRequest,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
    if (waitUntilReady) {
      return await pollUntilIndexIsReady(
        async () => {
          try {
            return await api.describeIndex({
              indexName: options.name,
              xPineconeApiVersion: X_PINECONE_API_VERSION,
            });
          } catch (e) {
            throw await handleApiError(
              e,
              async (_, rawMessageText) =>
                `Error waiting for index ${options.name} to be ready: ${rawMessageText}`,
            );
          }
        },
        options.name,
        timeout,
      );
    }
    return result;
  } catch (e) {
    if (
      suppressConflicts &&
      e instanceof Error &&
      e.name === 'PineconeConflictError'
    ) {
      return;
    }
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error creating index ${options.name}: ${rawMessageText}`,
    );
  }
}
