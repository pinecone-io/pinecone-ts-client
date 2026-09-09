import type {
  DocumentOperationsApi,
  DeleteDocumentsRequest,
  DeleteDocumentsResponse,
} from '../../pinecone-generated-ts-fetch/db_data';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';
import { assertNonEmptyArray } from './documentValidation';

export type {
  DeleteDocumentsRequest as DeleteDocumentsOptions,
  DeleteDocumentsResponse,
} from '../../pinecone-generated-ts-fetch/db_data';

export const deleteDocuments = async (
  api: DocumentOperationsApi,
  namespace: string,
  options: DeleteDocumentsRequest,
): Promise<DeleteDocumentsResponse> => {
  const given = [
    options.ids !== undefined,
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
  assertNonEmptyArray(options.ids, 'ids', 'document ID', 'deleteDocuments');
  try {
    return await api.deleteDocuments({
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
