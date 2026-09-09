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
 * Data-plane operations on the documents of a schema-based index.
 * Access via `index.documents`.
 *
 * Every operation is scoped to the namespace of the {@link Index} that owns the
 * accessor, so chain `.namespace()` to target a namespace other than
 * `__default__`.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 *
 * const index = pc.index('my-schema-index');
 * await index.documents.upsert({
 *   documents: [{ _id: 'doc-1', chunk_text: 'Hello world' }],
 * });
 *
 * // Scoped to a namespace
 * await index.namespace('my-namespace').documents.upsert({
 *   documents: [{ _id: 'doc-2', chunk_text: 'Hello namespace' }],
 * });
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
   * Upserts documents into a schema-based index.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.index('my-schema-index').namespace('my-namespace').documents.upsert({
   *   documents: [{ _id: 'doc-1', chunk_text: 'Hello world' }],
   * });
   * ```
   *
   * @param options - The {@link UpsertDocumentsOptions} containing the `documents` array (1–1000 entries). Each entry must have a required `_id` field.
   * @throws {@link Errors.PineconeArgumentError} when `documents` is empty or not provided.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to an {@link UpsertDocumentsResponse}.
   */
  async upsert(
    options: UpsertDocumentsOptions,
  ): Promise<UpsertDocumentsResponse> {
    const api = await this._provider.provide();
    return upsertDocuments(api, this._namespace, options);
  }

  /**
   * Searches for documents using one or more scoring methods.
   *
   * The `scoreBy` array specifies how documents are ranked. Supported scoring
   * method types are `text` (BM25), `dense_vector`, `sparse_vector`, and
   * `query_string`. Multiple scoring methods can be combined for hybrid search.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const results = await pc.index('my-schema-index')
   *   .namespace('my-namespace')
   *   .documents.search({
   *     scoreBy: [{ type: 'text', fields: ['chunk_text'], query: 'machine learning' }],
   *     topK: 5,
   *     includeFields: ['chunk_text'],
   *   });
   * ```
   *
   * @param options - The {@link SearchDocumentsOptions} for the search, including `scoreBy` (required), `topK` (required), and optional `includeFields`.
   * @throws {@link Errors.PineconeArgumentError} when `scoreBy` is empty or `topK` is less than 1.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link SearchDocumentsResponse} containing `matches`, `namespace`, and `usage`.
   */
  async search(
    options: SearchDocumentsOptions,
  ): Promise<SearchDocumentsResponse> {
    const api = await this._provider.provide();
    return searchDocuments(api, this._namespace, options);
  }

  /**
   * Fetches documents by ID.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const result = await pc.index('my-schema-index')
   *   .namespace('my-namespace')
   *   .documents.fetch({ ids: ['doc-1', 'doc-2'] });
   * ```
   *
   * @param options - The {@link FetchDocumentsOptions} identifying the documents to fetch.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link FetchDocumentsResponse}.
   */
  async fetch(options: FetchDocumentsOptions): Promise<FetchDocumentsResponse> {
    const api = await this._provider.provide();
    return fetchDocuments(api, this._namespace, options);
  }

  /**
   * Updates existing documents.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.index('my-schema-index')
   *   .namespace('my-namespace')
   *   .documents.update({
   *     documents: [{ _id: 'doc-1', chunk_text: 'Updated text' }],
   *   });
   * ```
   *
   * @param options - The {@link UpdateDocumentsOptions} containing the documents to update.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to an {@link UpdateDocumentsResponse} whose
   * `matchedRecords` reports how many documents the request matched.
   */
  async update(
    options: UpdateDocumentsOptions,
  ): Promise<UpdateDocumentsResponse> {
    const api = await this._provider.provide();
    return updateDocuments(api, this._namespace, options);
  }

  /**
   * Lists documents in the targeted namespace.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const result = await pc.index('my-schema-index')
   *   .namespace('my-namespace')
   *   .documents.list({ limit: 10 });
   *
   * // Omit options to list the first page with no prefix filter
   * const firstPage = await pc.index('my-schema-index').documents.list();
   * ```
   *
   * @param options - Optional {@link ListDocumentsOptions} for pagination and filtering. Defaults to `{}`, which lists the first page of documents in the targeted namespace.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link ListDocumentsResponse}.
   */
  async list(
    options: ListDocumentsOptions = {},
  ): Promise<ListDocumentsResponse> {
    const api = await this._provider.provide();
    return listDocuments(api, this._namespace, options);
  }

  /**
   * Deletes documents by ID or filter.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.index('my-schema-index')
   *   .namespace('my-namespace')
   *   .documents.delete({ ids: ['doc-1'] });
   * ```
   *
   * @param options - The {@link DeleteDocumentsOptions} identifying the documents to delete.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link DeleteDocumentsResponse} whose
   * `matchedRecords` reports how many documents the request matched.
   */
  async delete(
    options: DeleteDocumentsOptions,
  ): Promise<DeleteDocumentsResponse> {
    const api = await this._provider.provide();
    return deleteDocuments(api, this._namespace, options);
  }
}
