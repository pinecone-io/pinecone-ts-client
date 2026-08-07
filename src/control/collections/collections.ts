import type { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/db_control';
import type { PineconeConfiguration } from '../../data';
import { indexOperationsBuilder } from '../indexOperationsBuilder';
import { listCollections } from './listCollections';
import type { CollectionList, CollectionModel } from './listCollections';
import { createCollection, CreateCollectionOptions } from './createCollection';
import { describeCollection } from './describeCollection';
import { deleteCollection } from './deleteCollection';

/**
 * Control-plane operations for collections. Collections are only supported for
 * pod-based indexes. Access via `pc.collections`.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 *
 * const collections = await pc.collections.list();
 * ```
 *
 * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
 */
export class Collections {
  private _api: ManageIndexesApi;

  constructor(config: PineconeConfiguration) {
    this._api = indexOperationsBuilder(config);
  }

  /**
   * Lists all collections in the current project.
   *
   * Collections are only supported for pod-based indexes; serverless indexes
   * do not support collections.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const collectionList = await pc.collections.list();
   * console.log(collectionList);
   * // {
   * //   collections: [
   * //     {
   * //       name: 'my-collection',
   * //       size: 10000000,
   * //       status: 'Ready',
   * //       dimension: 1536,
   * //       recordCount: 120000,
   * //       source: 'my-pod-index'
   * //     }
   * //   ]
   * // }
   * ```
   *
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link CollectionList}.
   * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
   */
  async list(): Promise<CollectionList> {
    return listCollections(this._api);
  }

  /**
   * Creates a collection from a pod-based index.
   *
   * Collections snapshot the current state of a pod-based index and can be used
   * to create new indexes. Serverless indexes do not support collections.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const collection = await pc.collections.create({
   *   name: 'my-collection',
   *   source: 'my-pod-index',
   * });
   * console.log(collection);
   * // {
   * //   name: 'my-collection',
   * //   status: 'Initializing',
   * //   source: 'my-pod-index'
   * // }
   * ```
   *
   * @param options - The {@link CreateCollectionOptions} for the collection, including `name` and `source` index name.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link CollectionModel}.
   * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
   */
  async create(options: CreateCollectionOptions): Promise<CollectionModel> {
    return createCollection(this._api, options);
  }

  /**
   * Retrieves metadata for a single named collection.
   *
   * Collections are only supported for pod-based indexes; serverless indexes
   * do not support collections.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const collection = await pc.collections.describe('my-collection');
   * console.log(collection);
   * // {
   * //   name: 'my-collection',
   * //   size: 10000000,
   * //   status: 'Ready',
   * //   dimension: 1536,
   * //   recordCount: 120000,
   * //   source: 'my-pod-index'
   * // }
   * ```
   *
   * @param collectionName - The name of the collection to describe.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link CollectionModel}.
   * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
   */
  async describe(collectionName: string): Promise<CollectionModel> {
    return describeCollection(this._api, collectionName);
  }

  /**
   * Deletes an existing collection by name.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.collections.delete('my-collection');
   * ```
   *
   * @param collectionName - The name of the collection to delete.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the deletion request is completed.
   * @see [Collections](https://docs.pinecone.io/guides/indexes/collections/understanding-collections)
   */
  async delete(collectionName: string): Promise<void> {
    return deleteCollection(this._api, collectionName);
  }
}
