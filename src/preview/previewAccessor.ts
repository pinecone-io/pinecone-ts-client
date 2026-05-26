import { PreviewIndexes } from './indexes/previewIndexes';
import { PreviewIndex } from './indexes/previewIndex';
import type { PineconeConfiguration } from '../data';

/**
 * Provides access to alpha preview operations using the 2026-01.alpha API.
 *
 * Access via `pc.preview`.
 *
 * **Alpha notice:** This class is not covered by the SDK's backward compatibility
 * guarantee. Signatures may change without a major version bump.
 *
 * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
 * @alpha
 */
export class Preview {
  /**
   * Provides access to alpha control-plane index operations.
   *
   * @example
   * ```typescript
   * const list = await pc.preview.indexes.listIndexes();
   * ```
   * @alpha
   */
  public indexes: PreviewIndexes;

  private _config: PineconeConfiguration;

  constructor(config: PineconeConfiguration) {
    this._config = config;
    this.indexes = new PreviewIndexes(config);
  }

  /**
   * Returns a {@link PreviewIndex} for performing alpha data-plane document operations
   * against the named index.
   *
   * @example
   * ```typescript
   * const previewIndex = pc.preview.index('my-schema-index');
   * const result = await previewIndex.upsertDocuments('my-namespace', {
   *   documents: [{ _id: 'doc-1', content: 'Hello world' }],
   * });
   * ```
   *
   * @param indexName - The name of the schema-based index to target.
   * @see [Schema-based indexes](https://docs.pinecone.io/guides/indexes/schema-based)
   * @alpha
   */
  index(indexName: string): PreviewIndex {
    return new PreviewIndex(this._config, indexName);
  }
}
