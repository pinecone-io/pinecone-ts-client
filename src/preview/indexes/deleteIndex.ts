import type { ManageIndexesApi } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * Deletes an alpha index by name.
 *
 * **Alpha notice:** This function is not covered by the SDK's backward
 * compatibility guarantee.
 *
 * Deletion is asynchronous; the index may still be terminating after
 * this call returns. Deletion protection must be disabled on the index
 * before calling this method.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export async function deletePreviewIndex(
  api: ManageIndexesApi,
  name: string,
): Promise<void> {
  if (!name) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `name` in order to delete an index.',
    );
  }
  try {
    await api.deleteIndex({
      indexName: name,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error deleting preview index ${name}: ${rawMessageText}`,
    );
  }
}
