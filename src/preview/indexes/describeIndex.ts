import type {
  ManageIndexesApi,
  IndexModel,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * Describes an index by name using the 2026-01.alpha API.
 *
 * @alpha
 */
export async function describePreviewIndex(
  api: ManageIndexesApi,
  indexName: string,
): Promise<IndexModel> {
  if (!indexName) {
    throw new PineconeArgumentError(
      'You must pass a non-empty string for `indexName` in order to describe an index.',
    );
  }

  try {
    return await api.describeIndex({
      indexName,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error describing preview index ${indexName}: ${rawMessageText}`,
    );
  }
}
