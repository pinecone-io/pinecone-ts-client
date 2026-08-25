import type {
  DocumentOperationsApi,
  ListDocumentsRequest,
  ListDocumentsResponse,
} from '../../pinecone-generated-ts-fetch/db_data';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

export type {
  ListDocumentsRequest as ListDocumentsOptions,
  ListDocumentsResponse,
  ListedDocumentRecord,
  DocumentListUsage,
  // Pagination cursor on `ListDocumentsResponse`.
  Pagination as DocumentPagination,
} from '../../pinecone-generated-ts-fetch/db_data';

export const listDocuments = async (
  api: DocumentOperationsApi,
  namespace: string,
  options: ListDocumentsRequest = {},
): Promise<ListDocumentsResponse> => {
  if (options.limit != null && options.limit < 1) {
    throw new PineconeArgumentError(
      '`limit` must be a positive integer of at least 1.',
    );
  }
  try {
    return await api.listDocuments({
      namespace,
      listDocumentsRequest: options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error listing documents from namespace ${namespace}: ${rawMessageText}`,
    );
  }
};
