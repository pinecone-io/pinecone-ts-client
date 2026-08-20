import type {
  ManageIndexesApi,
  CreateIndexRequest,
  DenseVectorField,
  SparseVectorField,
  SemanticTextField,
  StringField,
  StringFieldFullTextSearch,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import { pollUntilIndexIsReady } from '../../utils';
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
 * an empty object to accept the defaults (`language: 'en'`, no stemming, no
 * stop-word filtering), or set the text analysis options explicitly.
 *
 * ```typescript
 * const field: FullTextSearchStringField = {
 *   type: 'string',
 *   fullTextSearch: {},
 * };
 * ```
 */
export type FullTextSearchStringField = StringField & {
  type: 'string';
  fullTextSearch: StringFieldFullTextSearch;
};

/**
 * The configuration of a single field in the schema of a new index.
 *
 * A schema declares the searchable fields of the index. One of four field types:
 *
 * - `dense_vector` — fixed-dimension vectors for semantic search.
 * - `sparse_vector` — sparse vectors for keyword or hybrid search.
 * - `semantic_text` — text embedded by an integrated model.
 * - `string` with `fullTextSearch` — see {@link FullTextSearchStringField}.
 *
 * Values you only need to filter on — numbers, booleans, string lists, and
 * plain strings — do not belong in the schema. Send them as document metadata
 * instead: they are indexed automatically at upsert time and appear on the
 * described index's {@link IndexSchema}.
 *
 * An index may declare at most one `dense_vector`, one `sparse_vector`, and one
 * `semantic_text` field, and must declare at least one field. A `semantic_text`
 * field cannot be combined with `dense_vector`, `sparse_vector`, or a full-text
 * search string field.
 *
 * @see [Create an index](https://docs.pinecone.io/guides/index-data/create-an-index)
 */
export type CreateIndexSchemaField =
  // `type` re-narrowed: the generated DenseVectorField accepts any field type.
  | (DenseVectorField & { type: 'dense_vector'; metric: IndexMetric })
  | SparseVectorField
  | (SemanticTextField & { metric?: IndexMetric })
  | FullTextSearchStringField;

/**
 * The schema of a new index: a map of field names to their configurations.
 *
 * Field names must be unique, non-empty strings, and cannot use the reserved
 * names `_id`, `_values`, or `_sparse_values`.
 *
 * @see [Create an index](https://docs.pinecone.io/guides/index-data/create-an-index)
 */
export interface CreateIndexSchema {
  fields: { [fieldName: string]: CreateIndexSchemaField };
}

/**
 * Options for creating a schema-based index.
 *
 */
export interface CreateIndexOptions extends Omit<
  CreateIndexRequest,
  'name' | 'schema' | 'readCapacity' | 'deletionProtection'
> {
  /** The name of the index to create. Must be unique within the project. */
  name: string;
  /** The typed fields stored in each document. See {@link CreateIndexSchema}. */
  schema: CreateIndexSchema;
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
   * When true, does not throw if an index with this name already exists.
   */
  suppressConflicts?: boolean;
}

/**
 * Creates a schema-based index.
 */
export async function createIndex(
  api: ManageIndexesApi,
  options: CreateIndexOptions,
): Promise<IndexModel | void> {
  if (!options.name) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `name` in order to create an index.',
    );
  }
  if (!options.schema) {
    throw new PineconeArgumentError(
      'You must pass a `schema` object in order to create an index.',
    );
  }

  const { waitUntilReady, timeout, suppressConflicts, ...createRequest } =
    options;

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
