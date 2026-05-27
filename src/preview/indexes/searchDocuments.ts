import type { DocumentOperationsApi } from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch-alpha/db_data';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

/**
 * Defines how documents are scored against a search query.
 *
 * @alpha
 */
export interface PreviewDocumentScoringMethod {
  /** The scoring method type. */
  type: 'dense_vector' | 'sparse_vector' | 'text' | 'query_string';
  /** The document field to score against. Required for dense_vector, sparse_vector, and text types. Must NOT be provided for query_string. */
  field?: string;
  /** Text query string. Used for text and query_string types. */
  query?: string;
  /** Dense vector values. Used for dense_vector type. */
  values?: number[];
  /** Sparse vector. Used for sparse_vector type. */
  sparse_values?: { indices: number[]; values: number[] };
}

/**
 * Options for searching documents in a schema-based index namespace.
 *
 * @alpha
 */
export interface PreviewSearchDocumentsOptions {
  /** One or more scoring methods that rank matching documents. Must have at least one entry. */
  score_by: PreviewDocumentScoringMethod[];
  /** Maximum number of top-ranked documents to return. Must be between 1 and 10000. */
  top_k: number;
  /** Document fields to include in results. If omitted, all fields are returned. */
  include_fields?: string[];
  /** Metadata filter expression to restrict the searched documents. */
  filter?: Record<string, unknown>;
}

/**
 * A single document result returned from a search operation.
 *
 * @alpha
 */
export interface PreviewDocumentSearchMatch {
  /** The unique identifier of the matched document. */
  _id: string;
  /** The similarity score of the matched document. */
  _score: number;
  [key: string]: unknown;
}

/**
 * Response from searching documents in a schema-based index namespace.
 *
 * @alpha
 */
export interface PreviewSearchDocumentsResponse {
  /** The matching documents ordered from most to least similar. */
  matches: PreviewDocumentSearchMatch[];
  /** The namespace that was searched. */
  namespace: string;
  /** Usage information for this operation. */
  usage: { read_units: number };
}

/**
 * Searches for documents in a namespace using one or more scoring methods.
 *
 * **Alpha notice:** This function is not covered by the SDK's backward compatibility
 * guarantee. Signatures may change without a major version bump.
 *
 * @alpha
 */
export const searchPreviewDocuments = async (
  api: DocumentOperationsApi,
  namespace: string,
  options: PreviewSearchDocumentsOptions,
): Promise<PreviewSearchDocumentsResponse> => {
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
      searchDocumentsRequest: {
        score_by: options.score_by,
        top_k: options.top_k,
        include_fields: options.include_fields,
        filter: options.filter as object | undefined,
      },
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
