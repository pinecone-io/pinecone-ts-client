import type {
  ManageIndexesApi,
  IndexList as GeneratedIndexList,
  IndexModel as GeneratedIndexModel,
  IndexModelStatus as GeneratedIndexModelStatus,
  IndexSchema as GeneratedIndexSchema,
  ReadCapacityStatus as GeneratedReadCapacityStatus,
  ReadCapacityDedicatedSpecResponse as GeneratedReadCapacityDedicatedSpecResponse,
  ReadCapacityOnDemandSpecResponse as GeneratedReadCapacityOnDemandSpecResponse,
  BooleanField,
  DenseVectorField,
  FloatField,
  IntegerField,
  LegacyMetadataField,
  ResponseStringField,
  SemanticTextField,
  SparseVectorField,
  StringListField,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { handleApiError } from '../../errors/handling';
import type {
  DeletionProtection,
  IndexMetric,
  IndexState,
  ReadCapacityState,
} from '../types';

export type {
  LegacyMetadataField,
  IntegerField,
  ResponseStringField,
  ResponseStringFieldFullTextSearch,
  ResponseStringFieldFullTextSearchNgram,
  ReadCapacityDedicatedConfig,
  ScalingConfigManual,
} from '../../pinecone-generated-ts-fetch/db_control';

/**
 * The status of an index.
 */
export interface IndexModelStatus extends Omit<
  GeneratedIndexModelStatus,
  'state'
> {
  /** The current state of the index. */
  state: IndexState;
}

/**
 * The state of an index's read capacity, including its current replica and
 * shard counts.
 */
export interface ReadCapacityStatus extends Omit<
  GeneratedReadCapacityStatus,
  'state'
> {
  /** The current state of the read capacity configuration. */
  state: ReadCapacityState;
}

/**
 * The dedicated read capacity of an index, with its current state.
 */
export interface ReadCapacityDedicatedSpecResponse extends Omit<
  GeneratedReadCapacityDedicatedSpecResponse,
  'status'
> {
  /** The current state of the read capacity configuration. */
  status: ReadCapacityStatus;
}

/**
 * The on-demand read capacity of an index, with its current state.
 */
export interface ReadCapacityOnDemandSpecResponse extends Omit<
  GeneratedReadCapacityOnDemandSpecResponse,
  'status'
> {
  /** The current state of the read capacity configuration. */
  status: ReadCapacityStatus;
}

/**
 * The read capacity of an index. Check `mode` to reach the dedicated
 * configuration.
 *
 * ```typescript
 * if (index.readCapacity?.mode === 'Dedicated') {
 *   console.log(index.readCapacity.dedicated?.nodeType);
 * }
 * ```
 *
 * @see [Dedicated read nodes](https://docs.pinecone.io/guides/index-data/dedicated-read-nodes)
 */
export type ReadCapacityResponse =
  | ({ mode: 'Dedicated' } & ReadCapacityDedicatedSpecResponse)
  | ({ mode: 'OnDemand' } & ReadCapacityOnDemandSpecResponse);

/**
 * A field in the schema of an existing index. Check `type` to narrow to a
 * specific field.
 *
 * Alongside the searchable fields you declared at creation, this covers the
 * metadata field types (`boolean`, `float`, `integer`, `string_list`, and
 * `string` without full-text search) that Pinecone adds automatically from
 * document metadata at upsert time. See {@link CreateIndexSchemaField} for the
 * set you can declare yourself.
 */
export type TypedIndexSchemaField =
  | ({ type: 'boolean' } & BooleanField)
  | ({ type: 'dense_vector' } & DenseVectorField & {
        metric: IndexMetric | (string & {});
      })
  | ({ type: 'float' } & FloatField)
  | ({ type: 'integer' } & IntegerField)
  | ({ type: 'semantic_text' } & SemanticTextField & {
        metric?: IndexMetric | (string & {});
      })
  | ({ type: 'sparse_vector' } & SparseVectorField)
  | ({ type: 'string' } & ResponseStringField)
  | ({ type: 'string_list' } & StringListField);

/**
 * A field in the schema of an existing index.
 *
 * Fields on indexes created before typed schemas were introduced carry no
 * `type` and appear as {@link LegacyMetadataField}, so check for `type` before
 * narrowing on it.
 */
export type IndexSchemaField = TypedIndexSchemaField | LegacyMetadataField;

/**
 * The schema of an existing index: a map of field names to their configurations.
 *
 * ```typescript
 * const field = index.schema.fields['chunk_text'];
 * if ('type' in field && field.type === 'dense_vector') {
 *   console.log(field.dimension, field.metric);
 * }
 * ```
 */
export interface IndexSchema extends Omit<GeneratedIndexSchema, 'fields'> {
  fields: { [fieldName: string]: IndexSchemaField };
}

/**
 * The configuration and status of an index, as returned by
 * {@link Indexes.describe}, {@link Indexes.create}, and {@link Indexes.configure}.
 */
export interface IndexModel extends Omit<
  GeneratedIndexModel,
  'status' | 'schema' | 'readCapacity' | 'deletionProtection'
> {
  /** The current status of the index. */
  status: IndexModelStatus;
  /** The typed fields stored in each document. */
  schema: IndexSchema;
  /** The read capacity configuration of the index. */
  readCapacity?: ReadCapacityResponse;
  /** Whether deletion protection is enabled for the index. */
  deletionProtection: DeletionProtection | (string & {});
}

/**
 * The indexes in a project, as returned by {@link Indexes.list}.
 */
export interface IndexList extends Omit<GeneratedIndexList, 'indexes'> {
  indexes?: Array<IndexModel>;
}

/**
 * Lists all indexes in the project.
 *
 */
export async function listIndexes(api: ManageIndexesApi): Promise<IndexList> {
  try {
    return await api.listIndexes({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) => `Error listing indexes: ${rawMessageText}`,
    );
  }
}
