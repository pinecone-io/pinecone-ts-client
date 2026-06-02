import { AlphaDocumentOperationsProvider } from './alphaDataOperationsProvider';
import {
  upsertPreviewDocuments,
  PreviewUpsertDocumentsOptions,
  PreviewUpsertDocumentsResponse,
} from './upsertDocuments';
import {
  searchPreviewDocuments,
  PreviewSearchDocumentsOptions,
  PreviewSearchDocumentsResponse,
} from './searchDocuments';
import {
  fetchPreviewDocuments,
  PreviewFetchDocumentsOptions,
  PreviewFetchDocumentsResponse,
} from './fetchDocuments';
import {
  deletePreviewDocuments,
  PreviewDeleteDocumentsOptions,
} from './deleteDocuments';
import type { PineconeConfiguration } from '../../data';

/**
 * Data-plane document operations for a schema-based index.
 * Access via `pc.preview.index('index-name')`.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 *
 * const index = pc.preview.index('my-schema-index');
 * await index.upsertDocuments('my-namespace', {
 *   documents: [{ _id: 'doc-1', chunk_text: 'Hello world' }],
 * });
 * ```
 *
 * Uses Pinecone API version `2026-01.alpha`.
 * Preview surface is not covered by SemVer — signatures and behavior
 * may change in any minor SDK release. Pin your SDK version when
 * relying on preview features.
 *
 * @alpha
 */
export class PreviewIndex {
  private _provider: AlphaDocumentOperationsProvider;

  constructor(config: PineconeConfiguration, indexName: string) {
    this._provider = new AlphaDocumentOperationsProvider(config, indexName);
  }

  /**
   * Upserts documents into a namespace of this schema-based index.
   *
   * Each document must include an `_id` field (the unique identifier) and any
   * additional fields defined in the index schema. If a document with the same
   * `_id` already exists it is overwritten.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const index = pc.preview.index('my-schema-index');
   * const result = await index.upsertDocuments('my-namespace', {
   *   documents: [
   *     { _id: 'doc-1', chunk_text: 'Machine learning is fascinating' },
   *     { _id: 'doc-2', chunk_text: 'Vector databases enable semantic search' },
   *   ],
   * });
   * console.log(result);
   * // { upsertedCount: 2 }
   * ```
   *
   * @param namespace - The namespace to upsert documents into.
   * @param options - The {@link PreviewUpsertDocumentsOptions} containing the `documents` array (1–1000 entries). Each entry must be a {@link PreviewDocumentRecord} with a required `_id` field.
   * @throws {@link Errors.PineconeArgumentError} when `documents` is empty or not provided.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link PreviewUpsertDocumentsResponse}.
   * @alpha
   */
  async upsertDocuments(
    namespace: string,
    options: PreviewUpsertDocumentsOptions,
  ): Promise<PreviewUpsertDocumentsResponse> {
    const api = await this._provider.provide();
    return upsertPreviewDocuments(api, namespace, options);
  }

  /**
   * Searches for documents in a namespace using one or more scoring methods.
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
   * const index = pc.preview.index('my-schema-index');
   * const results = await index.searchDocuments('my-namespace', {
   *   scoreBy: [
   *     { type: 'text', field: 'chunk_text', query: 'machine learning' },
   *   ],
   *   topK: 5,
   *   includeFields: ['chunk_text'],
   * });
   * console.log(results);
   * // {
   * //   matches: [
   * //     { _id: 'doc-1', _score: 0.98, chunk_text: 'Machine learning is fascinating' },
   * //     { _id: 'doc-2', _score: 0.72, chunk_text: 'Vector databases enable semantic search' },
   * //   ],
   * //   namespace: 'my-namespace',
   * //   usage: { readUnits: 1 }
   * // }
   * ```
   *
   * @param namespace - The namespace to search.
   * @param options - The {@link PreviewSearchDocumentsOptions} for the search, including `scoreBy` (required), `topK` (required), and optional `includeFields`.
   * @throws {@link Errors.PineconeArgumentError} when `scoreBy` is empty or `topK` is less than 1.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link PreviewSearchDocumentsResponse} containing `matches`, `namespace`, and `usage`.
   * @alpha
   */
  async searchDocuments(
    namespace: string,
    options: PreviewSearchDocumentsOptions,
  ): Promise<PreviewSearchDocumentsResponse> {
    const api = await this._provider.provide();
    return searchPreviewDocuments(api, namespace, options);
  }

  /**
   * Fetches documents from a namespace by their IDs.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const index = pc.preview.index('my-schema-index');
   *
   * // Fetch all fields
   * const result = await index.fetchDocuments('my-namespace', {
   *   ids: ['doc-1', 'doc-2'],
   * });
   * console.log(result);
   * // {
   * //   documents: {
   * //     'doc-1': { _id: 'doc-1', chunk_text: 'Machine learning is fascinating' },
   * //     'doc-2': { _id: 'doc-2', chunk_text: 'Vector databases enable semantic search' },
   * //   },
   * //   namespace: 'my-namespace',
   * //   usage: { read_units: 1 }
   * // }
   *
   * // Fetch only specific fields
   * const partial = await index.fetchDocuments('my-namespace', {
   *   ids: ['doc-1'],
   *   includeFields: ['chunk_text'],
   * });
   * ```
   *
   * @param namespace - The namespace to fetch documents from.
   * @param options - The {@link PreviewFetchDocumentsOptions} containing `ids` (required) and an optional `includeFields` list to limit which fields are returned.
   * @throws {@link Errors.PineconeArgumentError} when `ids` is empty or not provided.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link PreviewFetchDocumentsResponse} containing a `documents` map, `namespace`, and `usage`.
   * @alpha
   */
  async fetchDocuments(
    namespace: string,
    options: PreviewFetchDocumentsOptions,
  ): Promise<PreviewFetchDocumentsResponse> {
    const api = await this._provider.provide();
    return fetchPreviewDocuments(api, namespace, options);
  }

  /**
   * Deletes documents from a namespace by their IDs, or deletes all documents in the namespace.
   *
   * Exactly one of `ids` or `deleteAll` must be set.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const index = pc.preview.index('my-schema-index');
   *
   * // Delete specific documents by ID
   * await index.deleteDocuments('my-namespace', { ids: ['doc-1', 'doc-2'] });
   *
   * // Delete all documents in the namespace
   * await index.deleteDocuments('my-namespace', { deleteAll: true });
   * ```
   *
   * @param namespace - The namespace to delete documents from.
   * @param options - The {@link PreviewDeleteDocumentsOptions}: either `ids` (a non-empty list of document IDs) or `deleteAll: true`. These options are mutually exclusive.
   * @throws {@link Errors.PineconeArgumentError} when neither `ids` nor `deleteAll` is set, both are set at the same time, or `ids` is an empty array.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the deletion is complete.
   * @alpha
   */
  async deleteDocuments(
    namespace: string,
    options: PreviewDeleteDocumentsOptions,
  ): Promise<void> {
    const api = await this._provider.provide();
    return deletePreviewDocuments(api, namespace, options);
  }
}
