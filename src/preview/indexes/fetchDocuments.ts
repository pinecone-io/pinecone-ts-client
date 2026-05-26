import type { DocumentOperationsApi } from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * Options for fetching documents by ID from a schema-based index namespace.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export interface PreviewFetchDocumentsOptions {
  /** A list of document IDs to fetch. Must contain between 1 and 1000 entries. */
  ids: string[];
  /** Document fields to include in each result. If omitted, all fields are returned. */
  include_fields?: string[];
}

/**
 * A fetched document record containing its ID and field values.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export interface PreviewFetchedDocument {
  /** The unique identifier of the document. */
  _id: string;
  [key: string]: unknown;
}

/**
 * Response from fetching documents by ID from a schema-based index namespace.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export interface PreviewFetchDocumentsResponse {
  /** A map of document IDs to their fetched documents. */
  documents: Record<string, PreviewFetchedDocument>;
  /** The namespace the documents were fetched from. */
  namespace: string;
  /** Usage information for the fetch operation. */
  usage: { read_units: number };
}

/**
 * Fetches documents from a namespace by their IDs.
 *
 * **Alpha notice:** This function is not covered by the SDK's backward compatibility
 * guarantee. Signatures may change without a major version bump.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export const fetchPreviewDocuments = async (
  api: DocumentOperationsApi,
  namespace: string,
  options: PreviewFetchDocumentsOptions,
): Promise<PreviewFetchDocumentsResponse> => {
  if (!options.ids || options.ids.length === 0) {
    throw new PineconeArgumentError(
      'You must pass a non-empty `ids` array to fetchDocuments.',
    );
  }
  try {
    const response = await api.fetchDocuments({
      namespace,
      fetchDocumentsRequest: {
        ids: options.ids,
        include_fields: options.include_fields,
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
    return {
      documents: response.documents as Record<string, PreviewFetchedDocument>,
      namespace: response.namespace,
      usage: { read_units: response.usage.read_units },
    };
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error fetching documents from namespace ${namespace}: ${rawMessageText}`,
    );
  }
};
