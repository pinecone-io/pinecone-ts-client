import type {
  ManageIndexesApi,
  CollectionModel,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * Options for creating a collection from a pod-based index.
 *
 * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
 */
export interface CreateCollectionOptions {
  /** The name of the collection. Must be 1-45 chars, lowercase alphanumeric + '-', start/end alphanumeric. */
  name: string;
  /** The name of the source pod-based index to snapshot. */
  source: string;
}

/**
 * Creates a collection from a pod-based index.
 *
 * Collections snapshot the current state of a pod-based index. Serverless indexes
 * do not support collections.
 *
 * @param api - The manage-indexes API client.
 * @param options - Collection name and source index name.
 * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
 */
export async function createCollection(
  api: ManageIndexesApi,
  options: CreateCollectionOptions,
): Promise<CollectionModel> {
  if (!options.name) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `name` in order to create a collection.',
    );
  }
  if (!options.source) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `source` in order to create a collection.',
    );
  }

  try {
    return await api.createCollection({
      createCollectionRequest: options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error creating collection ${options.name}: ${rawMessageText}`,
    );
  }
}
