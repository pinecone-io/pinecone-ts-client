import type {
  ManageIndexesApi,
  CollectionList as GeneratedCollectionList,
  CollectionModel as GeneratedCollectionModel,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control';
import { handleApiError } from '../../errors/handling';
import type { CollectionStatus } from '../types';

/**
 * The configuration and status of a collection.
 *
 * @see [Understanding collections](https://docs.pinecone.io/docs/collections)
 */
export interface CollectionModel extends Omit<
  GeneratedCollectionModel,
  'status'
> {
  /** The current status of the collection. */
  status: CollectionStatus;
}

/**
 * The collections in a project, as returned by {@link Collections.list}.
 */
export interface CollectionList extends Omit<
  GeneratedCollectionList,
  'collections'
> {
  collections?: Array<CollectionModel>;
}

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
