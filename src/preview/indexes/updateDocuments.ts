import type {
  DocumentOperationsApi,
  UpdateDocumentsRequest,
} from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

export type {
  UpdateDocumentsRequest as PreviewUpdateDocumentsOptions,
  UpdateDocumentRecord as PreviewUpdateDocumentRecord,
} from '../../pinecone-generated-ts-fetch-alpha/db_data';

export const updatePreviewDocuments = async (
  api: DocumentOperationsApi,
  namespace: string,
  options: UpdateDocumentsRequest,
): Promise<void> => {
  if (!options.documents || options.documents.length === 0) {
    throw new PineconeArgumentError(
      'You must pass a non-empty `documents` array to updateDocuments.',
    );
  }
  try {
    await api.updateDocuments({
      namespace,
      updateDocumentsRequest: options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error updating documents in namespace ${namespace}: ${rawMessageText}`,
    );
  }
};
