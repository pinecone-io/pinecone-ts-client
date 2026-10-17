import type {
  DocumentOperationsApi,
  SearchDocumentsRequest,
  SearchDocumentsResponse,
  SparseValues,
} from '../../pinecone-generated-ts-fetch/db_data';
import {
  SparseValuesToJSON,
  X_PINECONE_API_VERSION,
} from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../errors';
import { handleApiError } from '../../errors/handling';

export type {
  DocumentSearchMatch,
  SearchDocumentsResponse,
  DocumentSearchUsage,
  SparseValues,
} from '../../pinecone-generated-ts-fetch/db_data';

/**
 * A scoring method that defines how documents are scored against a query.
 *
 * `type` selects the method and which other fields apply:
 * - `dense_vector`: `field` or `fields` naming one field, and `values`.
 * - `sparse_vector`: `field` or `fields` naming one field, and `sparseValues`.
 * - `text`: `field` or `fields` naming one or more fields, and `query`.
 * - `query_string`: `query` only. Use field qualifiers (`field:(clause)`) in the query to target a field.
 * - `embed` / `sparse_embed`: `field` or `fields` naming one `string` field that declares `embed` / `sparse_embed`, and `query`.
 */
export interface DocumentScoringMethod {
  /**
   * The scoring method: `dense_vector`, `sparse_vector`, `text`, `query_string`, `embed`, or `sparse_embed`.
   */
  type: string;
  /**
   * The fields to score against. Provide `fields` or `field` (not both) for every type except `query_string`, which takes neither.
   * `text` accepts one or more fields; the other types accept exactly one.
   */
  fields?: Array<string>;
  /**
   * The one-field form of `fields`.
   */
  field?: string;
  /**
   * The text query for `text`, `query_string`, `embed`, and `sparse_embed`. For `embed` and `sparse_embed`, Pinecone embeds
   * this text with the named field's model. Leading and trailing whitespace is trimmed, and an empty query is rejected.
   */
  query?: string;
  /**
   * The dense query vector for `dense_vector`. Its length must match the field's dimension.
   */
  values?: Array<number>;
  /**
   * The sparse query vector for `sparse_vector`.
   */
  sparseValues?: SparseValues;
}

/** Options for searching documents in a namespace. */
export interface SearchDocumentsOptions extends Omit<
  SearchDocumentsRequest,
  'scoreBy'
> {
  /**
   * The scoring clauses that rank documents. One clause of any type is always valid. Several clauses can be combined
   * only when every clause is `text` or `query_string`; a `dense_vector`, `sparse_vector`, `embed`, or `sparse_embed`
   * clause must be the only clause.
   */
  scoreBy: Array<DocumentScoringMethod>;
}

const DocumentScoringMethodToJSON = (value: DocumentScoringMethod) => ({
  type: value.type,
  fields: value.fields,
  field: value.field,
  query: value.query,
  values: value.values,
  sparse_values: SparseValuesToJSON(value.sparseValues),
});

export const searchDocuments = async (
  api: DocumentOperationsApi,
  namespace: string,
  options: SearchDocumentsOptions,
): Promise<SearchDocumentsResponse> => {
  if (!options.scoreBy || options.scoreBy.length === 0) {
    throw new PineconeArgumentError(
      'You must pass a non-empty `scoreBy` array to searchDocuments.',
    );
  }
  if (options.topK == null || options.topK < 1) {
    throw new PineconeArgumentError(
      '`topK` must be a positive integer of at least 1.',
    );
  }
  // The generated serializer throws on unknown `type` values and drops fields
  // that don't belong to the clause's type, so `score_by` is swapped into the
  // body after it runs to let the API validate clauses as sent.
  const scoreBy = options.scoreBy.map(DocumentScoringMethodToJSON);
  try {
    return await api.searchDocuments(
      {
        namespace,
        searchDocumentsRequest: { ...options, scoreBy: [] },
        xPineconeApiVersion: X_PINECONE_API_VERSION,
      },
      async ({ init }) => ({
        body: {
          ...(init.body as object),
          score_by: scoreBy,
        } as unknown as RequestInit['body'],
      }),
    );
  } catch (e) {
    throw await handleApiError(
      e,
      async (_, rawMessageText) =>
        `Error searching documents in namespace ${namespace}: ${rawMessageText}`,
    );
  }
};
