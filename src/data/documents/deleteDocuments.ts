import type {
  DocumentOperationsApi,
  DeleteDocumentsRequest,
} from '../../pinecone-generated-ts-fetch/db_data';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

export type { DeleteDocumentsRequest as DeleteDocumentsOptions } from '../../pinecone-generated-ts-fetch/db_data';

export const deleteDocuments = async (
  api: DocumentOperationsApi,
  namespace: string,
  options: DeleteDocumentsRequest,
): Promise<void> => {
  const given = [
    !!options.ids,
    options.filter !== undefined,
    !!options.deleteAll,
  ].filter(Boolean).length;

  if (given === 0) {
    throw new PineconeArgumentError(
      'You must specify exactly one of `ids`, `filter`, or `deleteAll` to deleteDocuments.',
    );
  }
  if (given > 1) {
    throw new PineconeArgumentError(
      '`ids`, `filter`, and `deleteAll` are mutually exclusive in deleteDocuments; pass exactly one.',
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
