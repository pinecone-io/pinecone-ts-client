import { UpsertCommand } from './upsert';
import { FetchCommand } from './fetch';
import type { FetchOptions } from './fetch';
import { UpdateCommand } from './update';
import type { UpdateOptions } from './update';
import { QueryCommand } from './query';
import type { QueryOptions } from './query';
import { deleteOne } from './deleteOne';
import { deleteMany } from './deleteMany';
import { deleteAll } from './deleteAll';
import { describeIndexStats } from './describeIndexStats';
import { VectorOperationsProvider } from './vectorOperationsProvider';
import type {
  PineconeConfiguration,
  RecordMetadata,
  PineconeRecord,
} from './types';

export type {
  PineconeConfiguration,
  PineconeRecord,
  RecordId,
  RecordSparseValues,
  RecordValues,
  RecordMetadata,
  RecordMetadataValue,
} from './types';
export { PineconeConfigurationSchema } from './types';
export type {
  DeleteManyOptions,
  DeleteManyByFilterOptions,
  DeleteManyByRecordIdOptions,
} from './deleteMany';
export type { DeleteOneOptions } from './deleteOne';
export type {
  DescribeIndexStatsOptions,
  IndexStatsDescription,
  IndexStatsNamespaceSummary,
} from './describeIndexStats';
export type { FetchOptions, FetchResponse } from './fetch';
export type { UpdateOptions } from './update';
export type {
  ScoredPineconeRecord,
  QueryByRecordId,
  QueryByVectorValues,
  QueryOptions,
  QueryResponse,
  QueryShared,
} from './query';

/**
 * @typeParam T - The type of metadata associated with each record.
 */
export class Index<T extends RecordMetadata = RecordMetadata> {
  private config: PineconeConfiguration;
  private target: {
    index: string;
    namespace: string;
  };

  /**
   * Delete all records from the index.
   *
   * @example
   * ```js
   * const pinecone = new Pinecone();
   * await pinecone.index('my-index').deleteAll();
   * ```
   * @returns A promise that resolves when the delete is completed.
   */
  deleteAll: ReturnType<typeof deleteAll>;

  /**
   * Delete records from the index by either an array of ids, or a filter object.
   * See [Filtering with metadata](https://docs.pinecone.io/docs/metadata-filtering#deleting-vectors-by-metadata-filter) for more on deleting records with filters.
   *
   * @example
   * ```js
   * const pinecone = new Pinecone();
   * await pinecone.index('my-index').deleteMany(['record-1', 'record-2']);
   *
   * // or
   * await pinecone.index('my-index').deleteMany({ filter: { genre: 'classical' }});
   * ```
   * @param options - An array of record id values or a filter object.
   * @returns A promise that resolves when the delete is completed.
   */
  deleteMany: ReturnType<typeof deleteMany>;

  /**
   * Delete a record from the index by id.
   *
   * @example
   * ```js
   * const pinecone = new Pinecone();
   * await pinecone.index('my-index').deleteOne('record-1');
   * ```
   * @param options - The record is for deletion.
   * @returns A promise that resolves when the delete is completed.
   */
  deleteOne: ReturnType<typeof deleteOne>;

  /**
   * Describes the index's statistics such as total number of records, records per namespace, and the index's dimension size.
   *
   * @example
   * ```js
   * const pinecone = new Pinecone();
   * await pinecone.index('my-index').describeIndexStats();
   *
   * // {
   * //  namespaces: {
   * //    '': { recordCount: 10 }
   * //    foo: { recordCount: 2000 },
   * //    bar: { recordCount: 2000 }
   * //   },
   * //   dimension: 1536,
   * //   indexFullness: 0,
   * //   totalRecordCount: 4010
   * // }
   * ```
   * @returns A promise that resolve with the {@link IndexStatsDescription} when the operation is completed.
   */
  describeIndexStats: ReturnType<typeof describeIndexStats>;

  private _fetchCommand: FetchCommand<T>;
  private _queryCommand: QueryCommand<T>;
  private _updateCommand: UpdateCommand<T>;
  private _upsertCommand: UpsertCommand<T>;

  /**
   * Instantiation of Index is handled by {@link Pinecone}
   *
   * @example
   * ```js
   * const pinecone = new Pinecone();
   * const index = pinecone.index('my-index');
   * ```
   *
   * @constructor
   * @param indexName - The name of the index being configured.
   * @param config - The configuration from the Pinecone client.
   * @param namespace - The namespace for the index.
   */
  constructor(
    indexName: string,
    config: PineconeConfiguration,
    namespace = ''
  ) {
    this.config = config;
    this.target = {
      index: indexName,
      namespace: namespace,
    };

    const apiProvider = new VectorOperationsProvider(config, indexName);

    this.deleteAll = deleteAll(apiProvider, namespace);
    this.deleteMany = deleteMany(apiProvider, namespace);
    this.deleteOne = deleteOne(apiProvider, namespace);
    this.describeIndexStats = describeIndexStats(apiProvider);

    this._fetchCommand = new FetchCommand<T>(apiProvider, namespace);
    this._queryCommand = new QueryCommand<T>(apiProvider, namespace);
    this._updateCommand = new UpdateCommand<T>(apiProvider, namespace);
    this._upsertCommand = new UpsertCommand<T>(apiProvider, namespace);
  }

  /**
   * Returns an {@link Index} targeting the specified namespace. By default, all operations take place inside the default namespace ''.
   *
   * @example
   * ```js
   * const pinecone = new Pinecone();
   * const indexNamed = pinecone.index('my-index').namespace('my-namespace');
   * ```
   *
   * @param namespace - The namespace to target within the index.
   */
  namespace(namespace: string): Index<T> {
    return new Index<T>(this.target.index, this.config, namespace);
  }

  /**
   * Upsert records to the index.
   *
   * @example
   * ```js
   * const pinecone = new Pinecone();
   * await pinecone.index('my-index').upsert([{
   *  id: 'record-1',
   *  values: [0.176, 0.345, 0.263],
   * },{
   *  id: 'record-2',
   *  values: [0.176, 0.345, 0.263],
   * }])
   * ```
   *
   * @param data - An array of {@link PineconeRecord} objects to upsert.
   * @returns A promise that resolves when the upsert is completed.
   * @throws {@link Errors.PineconeConnectionError} when invalid environment, project id, or index name is configured.
   * @throws {@link Errors.PineconeArgumentError} when invalid arguments are passed.
   */
  async upsert(data: Array<PineconeRecord<T>>) {
    return await this._upsertCommand.run(data);
  }

  /**
   * Fetch records from the index.
   *
   * @example
   * ```js
   * const pinecone = new Pinecone();
   * await pinecone.index('my-index').fetch(['record-1', 'record-2']);
   * ```
   * @param options - The {@link FetchOptions} for the operation.
   * @returns A promise that resolves with the {@link FetchResponse} when the fetch is completed.
   * @throws {@link Errors.PineconeConnectionError} when invalid environment, project id, or index name is configured.
   * @throws {@link Errors.PineconeArgumentError} when invalid arguments are passed.
   */
  async fetch(options: FetchOptions) {
    return await this._fetchCommand.run(options);
  }

  /**
   * Query records from the index by id or vector values.
   *
   * @example
   * ```js
   * const pinecone = new Pinecone();
   * await pinecone.index('my-index').query({ topK: 3, id: 'record-1'});
   *
   * // or
   * await pinecone.index('my-index').query({ topK: 3, vector: [0.176, 0.345, 0.263] });
   * ```
   *
   * @param options - The {@link QueryOptions} for the operation.
   * @returns A promise that resolves with the {@link QueryResponse} when the query is completed.
   * @throws {@link Errors.PineconeConnectionError} when invalid environment, project id, or index name is configured.
   * @throws {@link Errors.PineconeArgumentError} when invalid arguments are passed.
   */
  async query(options: QueryOptions) {
    return await this._queryCommand.run(options);
  }

  /**
   * Update a record in the index by id.
   *
   * @param options - The {@link UpdateOptions} for the operation.
   * @returns A promise that resolves when the update is completed.
   * @throws {@link Errors.PineconeConnectionError} when invalid environment, project id, or index name is configured.
   * @throws {@link Errors.PineconeArgumentError} when invalid arguments are passed.
   */
  async update(options: UpdateOptions<T>) {
    return await this._updateCommand.run(options);
  }
}
