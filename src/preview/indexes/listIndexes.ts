import type {
  ManageIndexesApi,
  IndexList,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { handleApiError } from '../../errors/handling';

export type {
  IndexList as PreviewIndexList,
  IndexModel as PreviewIndexModel,
  IndexModelStatus as PreviewIndexModelStatus,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';

/**
 * Lists all indexes in the project using the 2026-01.alpha API.
 *
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
