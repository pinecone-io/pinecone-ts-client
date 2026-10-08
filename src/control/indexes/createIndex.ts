import { decorateIndexModel } from './decorateIndexModel';
import type {
  ManageIndexesApi,
  CreateEmbedConfig,
  CreateIndexRequest,
  CreateSparseEmbedConfig,
  DenseVectorField,
  SparseVectorField,
  StringField,
  StringFieldFullTextSearch,
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
  CreateEmbedConfig,
  CreateSparseEmbedConfig,
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
 * The same field can also declare `embed` and `sparseEmbed`; see
 * {@link IntegratedEmbeddingStringField}.
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
export type FullTextSearchStringField = StringField & {
  /** Full-text search settings. Pass `{}` for the defaults. */
  fullTextSearch: StringFieldFullTextSearch;
};

/**
 * A `string` field with integrated embedding: Pinecone embeds the field's text
 * with a hosted model when you upsert or update a document, and embeds the
 * query text with the same model when a search scores the field with an
 * `embed` or `sparse_embed` clause. You never handle the vectors yourself.
 *
 * Declare `embed` for a dense embedding, `sparseEmbed` for a sparse one, or
 * both. Every key of either configuration is optional, so `{}` selects the
 * default model. The configuration is fixed at creation, and the described
 * index reports it resolved, with every omitted key filled in from the model.
 *
 * An index has one dense slot and one sparse slot: at most one field may be a
 * `dense_vector` field or declare `embed`, and at most one may be a
 * `sparse_vector` field or declare `sparseEmbed`.
 *
 * The field's text is stored by default, and stored text is always indexed
 * for full-text search, so the described index reports `fullTextSearch` with
 * default settings even when you declare only `embed`. Set `storeText: false`
 * to embed the text without storing it. Such a field cannot also declare
 * `fullTextSearch`, cannot be scored by `text` or `query_string` clauses or
 * matched by `$match_*` filters, and cannot be returned: a fetch or search
 * whose `includeFields` names it is rejected with a `400`, and `['*']` leaves
 * it out.
 *
 * Each value is at most 100 KB; when the text is stored, the full-text limit
 * of 10,000 tokens per value also applies. An upsert or update request against
 * an index with integrated embedding carries at most 96 documents.
 *
 * ```typescript
 * import type { IntegratedEmbeddingStringField } from '@pinecone-database/pinecone';
 *
 * const field: IntegratedEmbeddingStringField = {
 *   type: 'string',
 *   embed: { model: 'llama-text-embed-v2', dimension: 1024 },
 *   sparseEmbed: {},
 * };
 * ```
 *
 * @see [Create an index](https://docs.pinecone.io/guides/index-data/create-an-index)
 */
export type IntegratedEmbeddingStringField = StringField &
  (
    | {
        /** Dense embedding settings. Pass `{}` for the default model. */
        embed: CreateEmbedConfig;
      }
    | {
        /** Sparse embedding settings. Pass `{}` for the default model. */
        sparseEmbed: CreateSparseEmbedConfig;
      }
  );

/**
 * The configuration of a single field in the schema of a new index.
 *
 * A schema declares the searchable fields of the index. The creatable field
 * types:
 *
 * - `dense_vector` — fixed-dimension vectors for semantic search.
 * - `sparse_vector` — sparse vectors for keyword or hybrid search.
 * - `string` with `fullTextSearch`, `embed`, `sparseEmbed`, or any mix of the
 *   three — see {@link FullTextSearchStringField} and
 *   {@link IntegratedEmbeddingStringField}.
 *
 * A `semantic_text` field cannot be declared here. It is how a legacy
 * integrated index made by {@link Indexes.createForModel} reports its embedded
 * text field, so it still appears on the schema of an index you describe, as
 * one of the {@link IndexSchemaField} types. To have Pinecone embed text in an
 * index you create, declare a `string` field with `embed` or `sparseEmbed`.
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
  | FullTextSearchStringField
  | IntegratedEmbeddingStringField;

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
            return decorateIndexModel(
              await api.describeIndex({
                indexName: options.name,
                xPineconeApiVersion: X_PINECONE_API_VERSION,
              }),
            );
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
    return decorateIndexModel(result);
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
