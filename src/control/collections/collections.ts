import type { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/db_control';
import type { PineconeConfiguration } from '../../data';
import { indexOperationsBuilder } from '../indexOperationsBuilder';
import { listCollections } from './listCollections';
import type { CollectionList, CollectionModel } from './listCollections';
import { createCollection, CreateCollectionOptions } from './createCollection';
import { describeCollection } from './describeCollection';
import { deleteCollection } from './deleteCollection';

/**
 * Collections preserve snapshots of pod-based indexes.
 * Access them through {@link Pinecone.collections}; do not construct this class directly.
 * Use {@link Backups} for index backups instead of pod-based collections.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const pc = new Pinecone();
 * const collections = await pc.collections.list();
 * ```
 */
export class Collections {
  private _api: ManageIndexesApi;

  constructor(config: PineconeConfiguration) {
    this._api = indexOperationsBuilder(config);
  }

  /**
   * Lists all collections in the project.
   *
   * @returns The collections and their current status.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const result = await pc.collections.list();
   * console.log(result.collections);
   * ```
   */
  async list(): Promise<CollectionList> {
    return listCollections(this._api);
  }

  /**
   * Starts creating a collection from a pod-based index.
   *
   * @param options - The collection name and the source pod-based index name.
   * @returns The collection metadata and status; check {@link Collections.describe} for readiness.
   * @throws {@link Errors.PineconeArgumentError} when the collection name or source is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const collection = await pc.collections.create({
   *   name: 'catalog-snapshot',
   *   source: 'catalog-pod-index',
   * });
   * console.log(collection.status);
   * ```
   */
  async create(options: CreateCollectionOptions): Promise<CollectionModel> {
    return createCollection(this._api, options);
  }

  /**
   * Retrieves the metadata and status of a collection.
   *
   * @param collectionName - The collection name, such as `catalog-snapshot`.
   * @returns The collection status, size, dimension, and record count.
   * @throws {@link Errors.PineconeArgumentError} when the collection name is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const collection = await pc.collections.describe('catalog-snapshot');
   * console.log(collection.status);
   * ```
   */
  async describe(collectionName: string): Promise<CollectionModel> {
    return describeCollection(this._api, collectionName);
  }

  /**
   * Deletes a collection.
   *
   * @param collectionName - The collection name, such as `catalog-snapshot`.
   * @returns Resolves when the deletion request succeeds.
   * @throws {@link Errors.PineconeArgumentError} when the collection name is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * await pc.collections.delete('catalog-snapshot');
   * ```
   */
  async delete(collectionName: string): Promise<void> {
    return deleteCollection(this._api, collectionName);
  }
}
