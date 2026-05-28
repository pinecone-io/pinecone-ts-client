import type {
  ManageIndexesApi,
  CollectionList,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_control';
import { handleApiError } from '../../errors/handling';

export type {
  CollectionList as PreviewCollectionList,
  CollectionModel as PreviewCollectionModel,
} from '../../pinecone-generated-ts-fetch-alpha/db_control';

/**
 * Lists all collections in the current project using the 2026-01.alpha API.
 *
 * Collections are only supported for pod-based indexes; serverless indexes do
 * not support collections.
 *
 * @param api - The alpha manage-indexes API client.
 * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
 * @alpha
 */
export const listPreviewCollections = async (
  api: ManageIndexesApi,
): Promise<CollectionList> => {
  try {
    return await api.listCollections({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error listing preview collections: ${rawMessageText}`,
    );
  }
};
