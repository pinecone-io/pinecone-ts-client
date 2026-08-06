import type {
  ManageIndexesApi,
  IndexList,
  IndexModel,
} from '../../pinecone-generated-ts-fetch/db_control';
import type { PineconeConfiguration } from '../../data';
import { indexOperationsBuilder } from '../indexOperationsBuilder';
import { listIndexes } from './listIndexes';
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
 * Control-plane operations for the lifecycle of Pinecone indexes.
 * Access via `pc.indexes`.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 *
 * const list = await pc.indexes.list();
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
   * Lists all indexes in the project. The returned list includes `schema`
   * fields describing the typed fields of each index.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexList = await pc.indexes.list();
   * console.log(indexList);
   * // {
   * //   indexes: [
   * //     {
   * //       name: 'my-schema-index',
   * //       metric: 'cosine',
   * //       host: 'my-schema-index-abc123.svc.pinecone.io',
   * //       schema: {
   * //         fields: { chunk_text: { type: 'string', fullTextSearch: {} } }
   * //       },
   * //       status: { ready: true, state: 'Ready' }
   * //     }
   * //   ]
   * // }
   * ```
   *
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to {@link IndexList}.
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
   * Creates a schema-based index.
   *
   * The `schema` object defines the fields stored in each document. At least one
   * primary field (`dense_vector`, `sparse_vector`, `semantic_text`, or a `string`
   * field with `fullTextSearch`) must be present.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexModel = await pc.indexes.create({
   *   name: 'my-schema-index',
   *   schema: {
   *     fields: {
   *       chunk_text: { type: 'string', fullTextSearch: {} },
   *     },
   *   },
   *   waitUntilReady: true,
   * });
   * console.log(indexModel.name);
   * // 'my-schema-index'
   * ```
   *
   * @param options - The {@link CreateIndexOptions} for creating the index, including `name`, `schema`, and optional `waitUntilReady` and `timeout`.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeBadRequestError} when index creation fails due to invalid parameters or project quotas.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @throws {@link Errors.PineconeConflictError} when attempting to create an index using a name that already exists in the project.
   * @returns A promise that resolves to {@link IndexModel} when the creation request is accepted. Use `waitUntilReady: true` to block until the index is ready for data operations.
   */
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
   * Creates an index with an integrated embedding model.
   *
   * A convenience wrapper around {@link create}: the server builds a
   * `semantic_text` schema field named `field` from the model parameters you
   * provide. For full control over schema composition — for example combining
   * semantic text with additional metadata fields — use {@link create} directly.
   *
   * Integrated-embedding indexes are serverless only; omit `deployment` to
   * default to managed (serverless) on AWS `us-east-1`.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexModel = await pc.indexes.createForModel({
   *   name: 'my-model-index',
   *   field: 'chunk_text',
   *   model: 'multilingual-e5-large',
   *   waitUntilReady: true,
   * });
   * console.log(indexModel.name);
   * // 'my-model-index'
   * ```
   *
   * @param options - The {@link CreateIndexForModelOptions} for the index, including `name`, `field`, and `model`.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeBadRequestError} when index creation fails due to invalid parameters or project quotas.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @throws {@link Errors.PineconeConflictError} when attempting to create an index using a name that already exists in the project.
   * @returns A promise that resolves to {@link IndexModel} when the creation request is accepted.
   */
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
   * Describes an index by name, returning its configuration, schema, and status.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexModel = await pc.indexes.describe('my-schema-index');
   * console.log(indexModel);
   * // {
   * //   name: 'my-schema-index',
   * //   metric: 'cosine',
   * //   host: 'my-schema-index-abc123.svc.pinecone.io',
   * //   schema: {
   * //     fields: { chunk_text: { type: 'string', fullTextSearch: {} } }
   * //   },
   * //   status: { ready: true, state: 'Ready' }
   * // }
   * ```
   *
   * @param indexName - The name of the index to describe.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to {@link IndexModel}.
   */
  async describe(indexName: string): Promise<IndexModel> {
    const indexModel = await describeIndex(this._api, indexName);
    const host = indexModel.privateHost || indexModel.host;
    IndexHostSingleton._set(this._config, indexName, host);
    return indexModel;
  }

  /**
   * Deletes an index by name.
   *
   * Deletion is asynchronous; the index may still be terminating after this call returns.
   * Deletion protection must be disabled before calling this method.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * await pc.indexes.delete('my-schema-index');
   * ```
   *
   * @param name - The name of the index to delete.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the deletion request is accepted.
   */
  async delete(name: string): Promise<void> {
    await deleteIndex(this._api, name);
    IndexHostSingleton._delete(this._config, name);
  }

  /**
   * Configures an index by name.
   *
   * Only the fields present in `options` are updated; omit a field to leave it unchanged.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexModel = await pc.indexes.configure('my-schema-index', {
   *   deletion_protection: 'enabled',
   *   tags: { team: 'ml-platform' },
   * });
   * console.log(indexModel.name);
   * // 'my-schema-index'
   * ```
   *
   * @param name - The name of the index to configure.
   * @param options - The {@link ConfigureIndexOptions} fields to update. Only provided fields are changed.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to the updated {@link IndexModel}.
   */
  async configure(
    name: string,
    options: ConfigureIndexOptions,
  ): Promise<IndexModel> {
    return configureIndex(this._api, name, options);
  }
}
