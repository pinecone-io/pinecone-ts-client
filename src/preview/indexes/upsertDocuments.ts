import type { DocumentOperationsApi } from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * A document record to upsert into a schema-based index namespace.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export interface PreviewDocumentRecord {
  /** The unique identifier for the document. */
  _id: string;
  [key: string]: unknown;
}

/**
 * Options for upserting documents into a schema-based index namespace.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export interface PreviewUpsertDocumentsOptions {
  /** Documents to upsert. Must contain between 1 and 1000 entries. */
  documents: PreviewDocumentRecord[];
}

/**
 * Response from upserting documents into a schema-based index namespace.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export interface PreviewUpsertDocumentsResponse {
  /** The number of documents successfully upserted. */
  upserted_count: number;
}

/**
 * Upserts documents into a namespace of a schema-based index.
 *
 * **Alpha notice:** This function is not covered by the SDK's backward compatibility
 * guarantee. Signatures may change without a major version bump.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export const upsertPreviewDocuments = async (
  api: DocumentOperationsApi,
  namespace: string,
  options: PreviewUpsertDocumentsOptions,
): Promise<PreviewUpsertDocumentsResponse> => {
  if (!options.documents || options.documents.length === 0) {
    throw new PineconeArgumentError(
      'You must pass a non-empty `documents` array to upsertDocuments.',
    );
  }
  try {
    const response = await api.upsertDocuments({
      namespace,
      upsertDocumentsRequest: { documents: options.documents },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
    return { upserted_count: response.upserted_count };
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error upserting documents into namespace ${namespace}: ${rawMessageText}`,
    );
  }
};
