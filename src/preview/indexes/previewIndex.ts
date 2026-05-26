import { AlphaDocumentOperationsProvider } from './alphaDataOperationsProvider';
import {
  upsertPreviewDocuments,
  PreviewUpsertDocumentsOptions,
  PreviewUpsertDocumentsResponse,
} from './upsertDocuments';
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
}
