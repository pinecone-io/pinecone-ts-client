import type {
  DocumentOperationsApi,
  UpsertDocumentsRequest,
  UpsertDocumentsResponse,
} from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

export type {
  DocumentRecord as PreviewDocumentRecord,
  UpsertDocumentsRequest as PreviewUpsertDocumentsOptions,
  UpsertDocumentsResponse as PreviewUpsertDocumentsResponse,
} from '../../pinecone-generated-ts-fetch-alpha/db_data';

export const upsertPreviewDocuments = async (
  api: DocumentOperationsApi,
  namespace: string,
  options: UpsertDocumentsRequest,
): Promise<UpsertDocumentsResponse> => {
  if (!options.documents || options.documents.length === 0) {
    throw new PineconeArgumentError(
      'You must pass a non-empty `documents` array to upsertDocuments.',
    );
  }
  try {
    return await api.upsertDocuments({
      namespace,
      upsertDocumentsRequest: options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error upserting documents into namespace ${namespace}: ${rawMessageText}`,
    );
  }
};
