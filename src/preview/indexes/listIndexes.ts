import type {
  ManageIndexesApi,
  IndexList,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { handleApiError } from '../../errors/handling';

/**
 * Lists all indexes in the project using the 2026-01.alpha API.
 *
 * **Alpha notice:** This function is not covered by the SDK's backward compatibility
 * guarantee. Signatures may change without a major version bump.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export async function listPreviewIndexes(
  api: ManageIndexesApi,
): Promise<IndexList> {
  try {
    return await api.listIndexes({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error listing preview indexes: ${rawMessageText}`,
    );
  }
}
