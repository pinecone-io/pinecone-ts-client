import { DocumentOperationsProvider } from './documentOperationsProvider';
import {
  upsertDocuments,
  UpsertDocumentsOptions,
  UpsertDocumentsResponse,
} from './upsertDocuments';
import {
  searchDocuments,
  SearchDocumentsOptions,
  SearchDocumentsResponse,
} from './searchDocuments';
import {
  fetchDocuments,
  FetchDocumentsOptions,
  FetchDocumentsResponse,
} from './fetchDocuments';
import {
  deleteDocuments,
  DeleteDocumentsOptions,
  DeleteDocumentsResponse,
} from './deleteDocuments';
import {
  listDocuments,
  ListDocumentsOptions,
  ListDocumentsResponse,
} from './listDocuments';
import {
  updateDocuments,
  UpdateDocumentsOptions,
  UpdateDocumentsResponse,
} from './updateDocuments';

/**
 * Read and write documents whose fields follow a schema-based index's schema.
 * Access through {@link Index.documents}; do not construct this client directly.
 * Unlike vector operations on {@link Index}, these operations work with document fields and scoring
 * methods.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * const index = pc.index({ name: 'product-documents', namespace: 'products-en' });
 * const result = await index.documents.fetch({ ids: ['trail-shoe-42'] });
 * console.log(result.documents);
 * ```
 */
export class Documents {
  /** @internal */
  private _provider: DocumentOperationsProvider;
  /** @internal */
  private _namespace: string;

  /** @internal */
  constructor(provider: DocumentOperationsProvider, namespace: string) {
    this._provider = provider;
    this._namespace = namespace;
  }

  /**
   * Write documents to a schema-based index.
   *
   * @param options - A non-empty `documents` array; each document needs `_id` and fields matching
   * the index schema.
   * @returns The number of documents written in `upsertedCount`.
   * @throws {@link Errors.PineconeArgumentError} when `documents` is empty or missing.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-documents', namespace: 'products-en' });
   *
   * const result = await index.documents.upsert({
   *   documents: [{ _id: 'trail-shoe-42', title: 'Waterproof hiking shoe', category: 'footwear' }],
   * });
   * console.log(result.upsertedCount);
   * ```
   *
   * @see {@link Documents.update} for partial changes; {@link Index.upsertRecords} for integrated
   * embedding records.
   */
  async upsert(
    options: UpsertDocumentsOptions,
  ): Promise<UpsertDocumentsResponse> {
    const api = await this._provider.provide();
    return upsertDocuments(api, this._namespace, options);
  }

  /**
   * Search schema-based documents using one or more scoring methods.
   *
   * Choose scoring fields and methods supported by your index schema.
   *
   * @param options - Scoring methods in `scoreBy`, the result count `topK`, and optional filters
   * and returned fields.
   * @returns Ranked `matches`, the namespace, and usage information.
   * @throws {@link Errors.PineconeArgumentError} when `scoreBy` is missing or empty, or `topK` is
   * missing or less than 1.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-documents', namespace: 'products-en' });
   *
   * const result = await index.documents.search({
   *   scoreBy: [{ type: 'text', fields: ['title'], query: 'hiking shoes' }],
   *   topK: 5, includeFields: ['title'],
   * });
   * console.log(result.matches);
   * ```
   *
   * @see {@link Index.searchRecords} for integrated embedding search; {@link Index.query} for
   * vector similarity queries.
   */
  async search(
    options: SearchDocumentsOptions,
  ): Promise<SearchDocumentsResponse> {
    const api = await this._provider.provide();
    return searchDocuments(api, this._namespace, options);
  }

  /**
   * Fetch schema-based documents by IDs or a metadata filter.
   *
   * Fetching by filter returns one page at a time.
   *
   * @param options - Either non-empty `ids` or `filter`; use `paginationToken` only with a filter.
   * @returns Documents keyed by ID in `documents`, the namespace, usage, and a continuation token
   * when available.
   * @throws {@link Errors.PineconeArgumentError} when the selection is missing or invalid, or
   * pagination is requested without a filter.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-documents', namespace: 'products-en' });
   *
   * const result = await index.documents.fetch({ ids: ['trail-shoe-42'] });
   * console.log(result.documents['trail-shoe-42']);
   * ```
   *
   * @see {@link Documents.list} to list document IDs; {@link Index.fetch} for vector records.
   */
  async fetch(options: FetchDocumentsOptions): Promise<FetchDocumentsResponse> {
    const api = await this._provider.provide();
    return fetchDocuments(api, this._namespace, options);
  }

  /**
   * Partially update schema-based documents selected by IDs or a filter.
   *
   * Unspecified fields are preserved. The example changes `category` while retaining the document's
   * title and other fields.
   *
   * @param options - Per-ID changes in `documents`, or a `filter` with non-empty `setFields` and/or
   * `removeFields`.
   * @returns The number of documents matched by the request in `matchedRecords`.
   * @throws {@link Errors.PineconeArgumentError} when the selection or field changes are missing or
   * incompatible.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-documents', namespace: 'products-en' });
   *
   * await index.documents.update({
   *   documents: [{ _id: 'trail-shoe-42', category: 'hiking-footwear' }],
   * });
   * ```
   *
   * @see {@link Documents.upsert} to write documents; {@link Index.update} for vector records.
   */
  async update(
    options: UpdateDocumentsOptions,
  ): Promise<UpdateDocumentsResponse> {
    const api = await this._provider.provide();
    return updateDocuments(api, this._namespace, options);
  }

  /**
   * List one page of document IDs in the targeted namespace.
   *
   * @param options - An optional ID prefix, page size, and continuation token; defaults to the
   * first unfiltered page.
   * @returns Document entries in `documents`, ordered by ID, and `pagination.next` when another
   * page is available.
   * @throws {@link Errors.PineconeArgumentError} when `limit` is less than 1.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-documents', namespace: 'products-en' });
   *
   * const page = await index.documents.list({ prefix: 'trail-shoe-' });
   * console.log(page.documents);
   * ```
   *
   * @see {@link Documents.fetch} to retrieve document fields; {@link Index.listPaginated} for
   * vector record IDs.
   */
  async list(
    options: ListDocumentsOptions = {},
  ): Promise<ListDocumentsResponse> {
    const api = await this._provider.provide();
    return listDocuments(api, this._namespace, options);
  }

  /**
   * Delete schema-based documents by IDs, filter, or an entire namespace.
   *
   * `deleteAll: true` removes all documents in this client's namespace.
   *
   * @param options - Exactly one of non-empty `ids`, `filter`, or `deleteAll: true`.
   * @returns The number of documents matched by the request in `matchedRecords`.
   * @throws {@link Errors.PineconeArgumentError} when the selection is missing or invalid.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-documents', namespace: 'products-en' });
   *
   * const result = await index.documents.delete({ ids: ['trail-shoe-42'] });
   * console.log(result.matchedRecords);
   * ```
   *
   * @see {@link Index.deleteMany} for vector records.
   */
  async delete(
    options: DeleteDocumentsOptions,
  ): Promise<DeleteDocumentsResponse> {
    const api = await this._provider.provide();
    return deleteDocuments(api, this._namespace, options);
  }
}
