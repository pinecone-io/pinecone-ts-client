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
   * @param namespace - The namespace to upsert documents into.
   * @param options - The documents to upsert (1–1000 entries).
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
   * @param namespace - The namespace to search.
   * @param options - Search parameters including scoring methods and top_k.
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
   * @param namespace - The namespace to fetch documents from.
   * @param options - The IDs to fetch and optional field selection.
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
   * Deletes documents from a namespace by their IDs or deletes all documents.
   *
   * @param namespace - The namespace to delete documents from.
   * @param options - Either `ids` (list of IDs) or `delete_all: true`. Exactly one must be set.
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
