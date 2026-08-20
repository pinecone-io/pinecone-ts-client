import type {
  DocumentOperationsApi,
  UpdateDocumentsRequest,
} from '../../pinecone-generated-ts-fetch/db_data';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

export type {
  UpdateDocumentsRequest as UpdateDocumentsOptions,
  UpdateDocumentRecord,
} from '../../pinecone-generated-ts-fetch/db_data';

export const updateDocuments = async (
  api: DocumentOperationsApi,
  namespace: string,
  options: UpdateDocumentsRequest,
): Promise<void> => {
  const hasDocuments = !!options.documents && options.documents.length > 0;
  const hasFilter = options.filter !== undefined;
  const hasFieldChanges =
    (!!options.setFields && Object.keys(options.setFields).length > 0) ||
    (!!options.removeFields && options.removeFields.length > 0);

  if (hasDocuments && hasFilter) {
    throw new PineconeArgumentError(
      '`documents` and `filter` are mutually exclusive in updateDocuments; pass one or the other.',
    );
  }
  if (!hasDocuments && !hasFilter) {
    throw new PineconeArgumentError(
      'You must pass either a non-empty `documents` array or a `filter` with `setFields` and/or `removeFields` to updateDocuments.',
    );
  }
  if (hasFilter && !hasFieldChanges) {
    throw new PineconeArgumentError(
      'A `filter` update requires a non-empty `setFields` and/or `removeFields`.',
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
