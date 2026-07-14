import { PreviewIndexes } from './indexes/previewIndexes';
import { PreviewIndex } from './indexes/previewIndex';
import type { PineconeConfiguration } from '../data';
import type { IndexOptions } from '../types';

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
   * against a schema-based index.
   *
   * Provide either `name` (resolves the host via `describeIndex`) or `host`
   * (skips that round-trip). When both are provided, `host` is used directly
   * and `name` is only used for cache-key purposes.
   *
   * @example
   * ```typescript
   * // Resolve host automatically from the index name
   * const previewIndex = pc.preview.index({ name: 'my-schema-index' });
   *
   * // Skip host resolution when you already know the host URL
   * const previewIndex = pc.preview.index({ host: 'https://my-host.pinecone.io' });
   *
   * const result = await previewIndex.upsertDocuments('my-namespace', {
   *   documents: [{ _id: 'doc-1', content: 'Hello world' }],
   * });
   * ```
   *
   * @param options - {@link IndexOptions} — must include at least `name` or `host`.
   * @alpha
   */
  index(options: IndexOptions): PreviewIndex {
    return new PreviewIndex(this._config, options);
  }
}
