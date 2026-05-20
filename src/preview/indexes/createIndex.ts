import type {
  ManageIndexesApi,
  CreateIndexRequest,
  IndexModel,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import { debugLog } from '../../utils';

export type {
  CreateIndexSchema as PreviewCreateIndexSchema,
  CreateIndexSchemaField as PreviewCreateIndexSchemaField,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';

/**
 * Options for creating a schema-based index using the 2026-01.alpha API.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
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
   * Uses client-side polling with exponential backoff.
   */
  waitUntilReady?: boolean;
}

/**
 * Creates a schema-based index using the 2026-01.alpha API.
 *
 * **Alpha notice:** This function is not covered by the SDK's backward compatibility
 * guarantee. Signatures may change without a major version bump.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
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

  const { waitUntilReady, ...createRequest } = options;

  try {
    const result = await api.createIndex({
      createIndexRequest: createRequest,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
    if (waitUntilReady) {
      return await waitUntilPreviewIndexIsReady(api, options.name);
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

async function waitUntilPreviewIndexIsReady(
  api: ManageIndexesApi,
  indexName: string,
  seconds: number = 0,
): Promise<IndexModel> {
  try {
    const indexDescription = await api.describeIndex({
      indexName,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
    if (!indexDescription.status?.ready) {
      await new Promise((r) => setTimeout(r, 1000));
      return await waitUntilPreviewIndexIsReady(api, indexName, seconds + 1);
    } else {
      debugLog(`Index ${indexName} is ready after ${seconds}s`);
      return indexDescription;
    }
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error waiting for preview index ${indexName} to be ready: ${rawMessageText}`,
    );
  }
}
