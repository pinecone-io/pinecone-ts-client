import type {
  DocumentOperationsApi,
  SearchDocumentsRequest,
  SearchDocumentsResponse,
} from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

export type {
  DocumentScoringMethod as PreviewDocumentScoringMethod,
  SearchDocumentsRequest as PreviewSearchDocumentsOptions,
  DocumentSearchMatch as PreviewDocumentSearchMatch,
  SearchDocumentsResponse as PreviewSearchDocumentsResponse,
} from '../../pinecone-generated-ts-fetch-alpha/db_data';

export const searchPreviewDocuments = async (
  api: DocumentOperationsApi,
  namespace: string,
  options: SearchDocumentsRequest,
): Promise<SearchDocumentsResponse> => {
  if (!options.score_by || options.score_by.length === 0) {
    throw new PineconeArgumentError(
      'You must pass a non-empty `score_by` array to searchDocuments.',
    );
  }
  if (options.top_k == null || options.top_k < 1) {
    throw new PineconeArgumentError(
      '`top_k` must be a positive integer of at least 1.',
    );
  }
  try {
    return await api.searchDocuments({
      namespace,
      searchDocumentsRequest: options,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error searching documents in namespace ${namespace}: ${rawMessageText}`,
    );
  }
};
