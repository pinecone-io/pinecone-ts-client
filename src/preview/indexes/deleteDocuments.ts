import type {
  DocumentOperationsApi,
  DeleteDocumentsRequest,
} from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

export type { DeleteDocumentsRequest as PreviewDeleteDocumentsOptions } from '../../pinecone-generated-ts-fetch-alpha/db_data';

export const deletePreviewDocuments = async (
  api: DocumentOperationsApi,
  namespace: string,
  options: DeleteDocumentsRequest,
): Promise<void> => {
  if (!options.ids && !options.deleteAll) {
    throw new PineconeArgumentError(
      'You must specify either `ids` or `deleteAll` to deleteDocuments.',
    );
  }
  if (options.ids && options.deleteAll) {
    throw new PineconeArgumentError(
      '`ids` and `deleteAll` are mutually exclusive in deleteDocuments.',
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
