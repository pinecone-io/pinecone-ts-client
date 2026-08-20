import type {
  DocumentOperationsApi,
  FetchDocumentsRequest,
  FetchDocumentsResponse,
} from '../../pinecone-generated-ts-fetch/db_data';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

export type {
  FetchDocumentsRequest as FetchDocumentsOptions,
  FetchedDocumentRecord as FetchedDocument,
  FetchDocumentsResponse,
  DocumentFetchUsage,
} from '../../pinecone-generated-ts-fetch/db_data';

export const fetchDocuments = async (
  api: DocumentOperationsApi,
  namespace: string,
  options: FetchDocumentsRequest,
): Promise<FetchDocumentsResponse> => {
  if (!options.ids || options.ids.length === 0) {
    throw new PineconeArgumentError(
      'You must pass a non-empty `ids` array to fetchDocuments.',
    );
  }
  try {
    return await api.fetchDocuments({
      namespace,
      fetchDocumentsRequest: options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error fetching documents from namespace ${namespace}: ${rawMessageText}`,
    );
  }
};
