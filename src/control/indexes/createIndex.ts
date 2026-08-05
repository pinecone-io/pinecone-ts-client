import type {
  ManageIndexesApi,
  CreateIndexRequest,
  IndexModel,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import { pollUntilIndexIsReady } from '../../utils';

// Re-export generated types for indexes
export type {
  CreateIndexSchema,
  CreateIndexSchemaField,
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
  ReadCapacity,
} from '../../pinecone-generated-ts-fetch/db_control';

/**
 * Options for creating a schema-based index.
 *
 */
export interface CreateIndexOptions extends Omit<CreateIndexRequest, 'name'> {
  /** The name of the index to create. Must be unique within the project. */
  name: string;
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
