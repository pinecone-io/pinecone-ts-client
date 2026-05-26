import type { ManageIndexesApi } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * Deletes an existing collection.
 *
 * **Alpha notice:** This function is not covered by the SDK's backward compatibility guarantee.
 *
 * @see [Collections](https://docs.pinecone.io/guides/indexes/collections)
 * @alpha
 */
export async function deletePreviewCollection(
  api: ManageIndexesApi,
  collectionName: string,
): Promise<void> {
  if (!collectionName) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `collectionName` in order to delete a collection.',
    );
  }

  try {
    await api.deleteCollection({
      collectionName,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error deleting preview collection ${collectionName}: ${rawMessageText}`,
    );
  }
}
