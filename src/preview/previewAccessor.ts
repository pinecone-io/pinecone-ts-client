import { PreviewIndexes } from './indexes/previewIndexes';
import { PreviewIndex } from './indexes/previewIndex';
import type { PineconeConfiguration } from '../data';

/**
 * Entry point for Pinecone preview operations. Access via `pc.preview`.
 *
 * Uses Pinecone API version `2026-01.alpha`.
 * Preview surface is not covered by SemVer — signatures and behavior may change
 * in any minor SDK release. Pin your SDK version when relying on preview features.
 *
 * @alpha
 */
export class Preview {
  /**
   * Control-plane index operations (list, create, configure, describe, delete,
   * backups, restore jobs, collections).
   *
   * @example
   * ```typescript
   * const list = await pc.preview.indexes.list();
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
   * Returns a {@link PreviewIndex} for performing data-plane document operations
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
   * @alpha
   */
  index(indexName: string): PreviewIndex {
    return new PreviewIndex(this._config, indexName);
  }
}
