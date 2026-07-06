import type {
  ManageIndexesApi,
  CreateIndexRequest,
  IndexModel,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import { pollUntilIndexIsReady } from '../../utils';

// Re-export generated types for indexes
export type {
  CreateIndexSchema as PreviewCreateIndexSchema,
  CreateIndexSchemaField as PreviewCreateIndexSchemaField,
  IndexDeploymentRequest as PreviewIndexDeploymentRequest,
  IndexDeployment as PreviewIndexDeployment,
  ManagedDeployment as PreviewManagedDeployment,
  ByocDeployment as PreviewByocDeployment,
  PodDeployment as PreviewPodDeployment,
  BooleanField as PreviewBooleanField,
  DenseVectorField as PreviewDenseVectorField,
  FloatField as PreviewFloatField,
  SemanticTextField as PreviewSemanticTextField,
  SparseVectorField as PreviewSparseVectorField,
  StringField as PreviewStringField,
  StringListField as PreviewStringListField,
  StringFieldFullTextSearch as PreviewStringFieldFullTextSearch,
  StringFieldFullTextSearchNgram as PreviewStringFieldFullTextSearchNgram,
  ReadCapacity as PreviewReadCapacity,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';

/**
 * Options for creating a schema-based index using the 2026-01.alpha API.
 *
 * @alpha
 */
export interface PreviewCreateIndexOptions extends Omit<
  CreateIndexRequest,
  'name'
> {
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
}

/**
 * Creates a schema-based index using the 2026-01.alpha API.
 *
 * @alpha
 */
export async function createPreviewIndex(
  api: ManageIndexesApi,
  options: PreviewCreateIndexOptions,
): Promise<IndexModel> {
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

  const { waitUntilReady, timeout, ...createRequest } = options;

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
                `Error waiting for preview index ${options.name} to be ready: ${rawMessageText}`,
            );
          }
        },
        options.name,
        timeout,
      );
    }
    return result;
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error creating preview index ${options.name}: ${rawMessageText}`,
    );
  }
}
