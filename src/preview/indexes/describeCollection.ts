import type {
  ManageIndexesApi,
  CollectionModel,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * Retrieves metadata for a single named collection using the 2026-01.alpha API.
 *
 * Collections are only supported for pod-based indexes; serverless indexes do
 * not support collections.
 *
 * **Alpha notice:** This function is not covered by the SDK's backward
 * compatibility guarantee. Signatures may change without a major version bump.
 *
 * @param api - The alpha manage-indexes API client.
 * @param collectionName - The name of the collection to describe.
 * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
 * @alpha
 */
export async function describePreviewCollection(
  api: ManageIndexesApi,
  collectionName: string,
): Promise<CollectionModel> {
  if (!collectionName) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `collectionName` in order to describe a collection.',
    );
  }

  try {
    return await api.describeCollection({
      collectionName,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error describing preview collection ${collectionName}: ${rawMessageText}`,
    );
  }
}
