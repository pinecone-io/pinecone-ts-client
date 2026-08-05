import type {
  ManageIndexesApi,
  CollectionList,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { handleApiError } from '../../errors/handling';

export type {
  CollectionList,
  CollectionModel,
} from '../../pinecone-generated-ts-fetch/db_control';

/**
 * Lists all collections in the current project.
 *
 * Collections are only supported for pod-based indexes; serverless indexes do
 * not support collections.
 *
 * @param api - The manage-indexes API client.
 * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
 */
export const listCollections = async (
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
        `Error listing collections: ${rawMessageText}`,
    );
  }
};
