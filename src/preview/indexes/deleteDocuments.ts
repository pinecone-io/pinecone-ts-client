import type { DocumentOperationsApi } from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * Options for deleting documents from a schema-based index namespace.
 *
 * Exactly one of `ids` or `delete_all` must be specified.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export interface PreviewDeleteDocumentsOptions {
  /** A list of document IDs to delete. Must contain between 1 and 1000 entries. Mutually exclusive with `delete_all`. */
  ids?: string[];
  /** If true, deletes all documents in the namespace. Mutually exclusive with `ids`. */
  delete_all?: boolean;
}

/**
 * Deletes documents from a namespace by their IDs or deletes all documents.
 *
 * **Alpha notice:** This function is not covered by the SDK's backward compatibility
 * guarantee. Signatures may change without a major version bump.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export const deletePreviewDocuments = async (
  api: DocumentOperationsApi,
  namespace: string,
  options: PreviewDeleteDocumentsOptions,
): Promise<void> => {
  if (!options.ids && !options.delete_all) {
    throw new PineconeArgumentError(
      'You must specify either `ids` or `delete_all` to deleteDocuments.',
    );
  }
  if (options.ids && options.delete_all) {
    throw new PineconeArgumentError(
      '`ids` and `delete_all` are mutually exclusive in deleteDocuments.',
    );
  }
  if (options.ids && options.ids.length === 0) {
    throw new PineconeArgumentError(
      '`ids` must contain at least one document ID in deleteDocuments.',
    );
  }
  try {
    await api.deleteDocuments({
      namespace,
      deleteDocumentsRequest: options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, msg) =>
        `Error deleting documents from namespace ${namespace}: ${msg}`,
    );
  }
};
