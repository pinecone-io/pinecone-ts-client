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
  const hasIds = !!options.ids && options.ids.length > 0;
  const hasFilter = options.filter !== undefined;

  if (hasIds && hasFilter) {
    throw new PineconeArgumentError(
      '`ids` and `filter` are mutually exclusive in fetchDocuments; pass one or the other.',
    );
  }
  if (!hasIds && !hasFilter) {
    throw new PineconeArgumentError(
      'You must pass either a non-empty `ids` array or a `filter` to fetchDocuments.',
    );
  }
  if (options.paginationToken !== undefined && !hasFilter) {
    throw new PineconeArgumentError(
      '`paginationToken` is only valid together with `filter` in fetchDocuments.',
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
