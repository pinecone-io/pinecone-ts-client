import type { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/db_control';
import type { PineconeConfiguration } from '../../data';
import { indexOperationsBuilder } from '../indexOperationsBuilder';
import { listIndexes } from './listIndexes';
import type { IndexList, IndexModel } from './listIndexes';
import { createIndex, CreateIndexOptions } from './createIndex';
import {
  createIndexForModel,
  CreateIndexForModelOptions,
} from './createIndexForModel';
import { describeIndex } from './describeIndex';
import { deleteIndex } from './deleteIndex';
import { configureIndex, ConfigureIndexOptions } from './configureIndex';
import { IndexHostSingleton } from '../../data/indexHostSingleton';

/**
 * Indexes store documents and define the fields available for search.
 * Access index management through {@link Pinecone.indexes}; do not construct this class directly.
 * Use {@link Pinecone.index} to read, write, and search data within an index.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const pc = new Pinecone();
 * const indexes = await pc.indexes.list();
 * ```
 */
export class Indexes {
  private _api: ManageIndexesApi;
  private _config: PineconeConfiguration;

  constructor(config: PineconeConfiguration) {
    this._config = config;
    this._api = indexOperationsBuilder(config);
  }

  /**
   * Lists all indexes in the project.
   *
   * @returns The indexes and their configuration, schema, and readiness status.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const result = await pc.indexes.list();
   * console.log(result.indexes);
   * ```
   */
  async list(): Promise<IndexList> {
    const indexList = await listIndexes(this._api);
    if (indexList.indexes && indexList.indexes.length > 0) {
      for (const index of indexList.indexes) {
        const host = index.privateHost || index.host;
        IndexHostSingleton._set(this._config, index.name, host);
      }
    }
    return indexList;
  }

  /**
   * Creates an index with searchable fields defined by a schema.
   *
   * Creation returns before the index is ready unless `waitUntilReady` is true.
   *
   * @param options - The index name and schema. Set `waitUntilReady` to wait before writing data.
   * @returns The index configuration and status.
   * @throws {@link Errors.PineconeArgumentError} when the index name or schema is missing.
   * @throws {@link Errors.PineconeConflictError} when an index with this name already exists.
   * @throws {@link Errors.PineconeTimeoutError} when the readiness timeout expires.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const index = await pc.indexes.create({
   *   name: 'product-catalog',
   *   schema: { fields: { description: { type: 'string', fullTextSearch: {} } } },
   *   waitUntilReady: true,
   * });
   * console.log(index.name);
   * ```
   *
   * @see {@link Indexes.createForModel} to embed document text with an integrated model.
   */
  create(
    options: CreateIndexOptions & { suppressConflicts?: false },
  ): Promise<IndexModel>;
  /**
   * Creates an index with searchable fields defined by a schema.
   *
   * Creation returns before the index is ready unless `waitUntilReady` is true.
   *
   * @param options - The index name and schema. Set `waitUntilReady` to wait before writing data.
   * @returns The index configuration and status, or `undefined` if `suppressConflicts` ignores an existing index.
   * @throws {@link Errors.PineconeArgumentError} when the index name or schema is missing.
   * @throws {@link Errors.PineconeConflictError} when the name exists and `suppressConflicts` is false.
   * @throws {@link Errors.PineconeTimeoutError} when the readiness timeout expires.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const index = await pc.indexes.create({
   *   name: 'product-catalog',
   *   schema: { fields: { description: { type: 'string', fullTextSearch: {} } } },
   *   suppressConflicts: true,
   * });
   * console.log(index?.name);
   * ```
   *
   * @see {@link Indexes.createForModel} to embed document text with an integrated model.
   */
  create(options: CreateIndexOptions): Promise<IndexModel | void>;
  async create(options: CreateIndexOptions): Promise<IndexModel | void> {
    const indexModel = await createIndex(this._api, options);
    // `createIndex` resolves to `void` when `suppressConflicts` swallowed a
    // conflict, in which case there is no host to cache.
    if (!indexModel) {
      return;
    }
    const host = indexModel.privateHost || indexModel.host;
    IndexHostSingleton._set(this._config, indexModel.name, host);
    return indexModel;
  }

  /**
   * Creates an index that embeds document text with an integrated model.
   *
   * Creation returns before the index is ready unless `waitUntilReady` is true.
   *
   * @param options - The index name, cloud, region, and embedding configuration. Use `fieldMap` to select your text field.
   * @returns The index configuration and status.
   * @throws {@link Errors.PineconeArgumentError} when required index or embedding settings are missing or the metric is invalid.
   * @throws {@link Errors.PineconeConflictError} when an index with this name already exists.
   * @throws {@link Errors.PineconeTimeoutError} when the readiness timeout expires.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const index = await pc.indexes.createForModel({
   *   name: 'product-catalog',
   *   cloud: 'aws',
   *   region: 'us-east-1',
   *   embed: {
   *     model: 'multilingual-e5-large',
   *     fieldMap: { text: 'description' },
   *   },
   *   waitUntilReady: true,
   * });
   * console.log(index.name);
   * ```
   *
   * @see {@link Indexes.create} to define vector or full-text search fields yourself.
   */
  createForModel(
    options: CreateIndexForModelOptions & { suppressConflicts?: false },
  ): Promise<IndexModel>;
  /**
   * Creates an index that embeds document text with an integrated model.
   *
   * Creation returns before the index is ready unless `waitUntilReady` is true.
   *
   * @param options - The index name, cloud, region, and embedding configuration. Use `fieldMap` to select your text field.
   * @returns The index configuration and status, or `undefined` if `suppressConflicts` ignores an existing index.
   * @throws {@link Errors.PineconeArgumentError} when required index or embedding settings are missing or the metric is invalid.
   * @throws {@link Errors.PineconeConflictError} when the name exists and `suppressConflicts` is false.
   * @throws {@link Errors.PineconeTimeoutError} when the readiness timeout expires.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const index = await pc.indexes.createForModel({
   *   name: 'product-catalog',
   *   cloud: 'aws',
   *   region: 'us-east-1',
   *   embed: {
   *     model: 'multilingual-e5-large',
   *     fieldMap: { text: 'description' },
   *   },
   *   suppressConflicts: true,
   * });
   * console.log(index?.name);
   * ```
   *
   * @see {@link Indexes.create} to define vector or full-text search fields yourself.
   */
  createForModel(
    options: CreateIndexForModelOptions,
  ): Promise<IndexModel | void>;
  async createForModel(
    options: CreateIndexForModelOptions,
  ): Promise<IndexModel | void> {
    const indexModel = await createIndexForModel(this._api, options);
    if (!indexModel) {
      return;
    }
    const host = indexModel.privateHost || indexModel.host;
    IndexHostSingleton._set(this._config, indexModel.name, host);
    return indexModel;
  }

  /**
   * Retrieves the configuration, schema, and readiness of an index.
   *
   * @param indexName - The index name, such as `product-catalog`.
   * @returns The index configuration, host, schema, and current status.
   * @throws {@link Errors.PineconeArgumentError} when the index name is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const index = await pc.indexes.describe('product-catalog');
   * console.log(index.status.ready);
   * ```
   */
  async describe(indexName: string): Promise<IndexModel> {
    const indexModel = await describeIndex(this._api, indexName);
    const host = indexModel.privateHost || indexModel.host;
    IndexHostSingleton._set(this._config, indexName, host);
    return indexModel;
  }

  /**
   * Deletes an index and its data.
   *
   * Disable deletion protection first. The index may still be terminating when this call returns.
   *
   * @param name - The index name, such as `product-catalog`.
   * @returns Resolves when the deletion request is accepted.
   * @throws {@link Errors.PineconeArgumentError} when the index name is empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * await pc.indexes.delete('product-catalog');
   * ```
   */
  async delete(name: string): Promise<void> {
    await deleteIndex(this._api, name);
    IndexHostSingleton._delete(this._config, name);
  }

  /**
   * Updates an index configuration.
   *
   * Omitted fields remain unchanged.
   *
   * @param name - The index name, such as `product-catalog`.
   * @param options - The settings to change; provide at least one field.
   * @returns The updated index configuration and status.
   * @throws {@link Errors.PineconeArgumentError} when the name is empty or no configuration field is provided.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   *
   * const pc = new Pinecone();
   * const index = await pc.indexes.configure('product-catalog', {
   *   deletionProtection: 'enabled',
   * });
   * console.log(index.deletionProtection);
   * ```
   */
  async configure(
    name: string,
    options: ConfigureIndexOptions,
  ): Promise<IndexModel> {
    return configureIndex(this._api, name, options);
  }
}
