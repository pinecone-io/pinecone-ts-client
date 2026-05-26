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
import type { PineconeConfiguration } from '../../data';

/**
 * Provides access to alpha data-plane document operations using the 2026-01.alpha API.
 *
 * Access via `pc.preview.index('index-name')`.
 *
 * **Alpha notice:** This class is not covered by the SDK's backward compatibility
 * guarantee. Signatures may change without a major version bump.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
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
   * **Alpha notice:** This method is not covered by the SDK's backward compatibility
   * guarantee.
   *
   * @param namespace - The namespace to upsert documents into.
   * @param options - The documents to upsert (1–1000 entries).
   * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
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
   * **Alpha notice:** This method is not covered by the SDK's backward compatibility
   * guarantee.
   *
   * @param namespace - The namespace to search.
   * @param options - Search parameters including scoring methods and top_k.
   * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
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
   * **Alpha notice:** This method is not covered by the SDK's backward compatibility
   * guarantee.
   *
   * @param namespace - The namespace to fetch documents from.
   * @param options - The IDs to fetch and optional field selection.
   * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
   * @alpha
   */
  async fetchDocuments(
    namespace: string,
    options: PreviewFetchDocumentsOptions,
  ): Promise<PreviewFetchDocumentsResponse> {
    const api = await this._provider.provide();
    return fetchPreviewDocuments(api, namespace, options);
  }
}
