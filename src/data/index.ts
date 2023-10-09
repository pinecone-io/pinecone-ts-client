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
import type { RecordMetadata, PineconeRecord } from './types';
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
 * The `Index` class is used to perform data operations (upsert, query, etc)
 * against Pinecone indexes. Typically it will be instantiated via a `Pinecone`
 * client instance that has already built the required configuration from a
 * combination of sources.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 *
 * const pinecone = new Pinecone()
 * const index = pinecone.index('index-name')
 * ```
 *
 * ### Targeting an index, with user-defined Metadata types
 *
 * If you are storing metadata alongside your vector values inside your Pinecone records, you can pass a type parameter to `index()` in order to get proper TypeScript typechecking when upserting and querying data.
 *
 * ```typescript
 * const pinecone = new Pinecone();
 *
 * type MovieMetadata = {
 *   title: string,
 *   runtime: numbers,
 *   genre: 'comedy' | 'horror' | 'drama' | 'action'
 * }
 *
 * // Specify a custom metadata type while targeting the index
 * const index = pinecone.index<MovieMetadata>('test-index');
 *
 * // Now you get type errors if upserting malformed metadata
 * await index.upsert([{
 *   id: '1234',
 *   values: [
 *     .... // embedding values
 *   ],
 *   metadata: {
 *     genre: 'Gone with the Wind',
 *     runtime: 238,
 *     genre: 'drama',
 *
 *     // @ts-expect-error because category property not in MovieMetadata
 *     category: 'classic'
 *   }
 * }])
 *
 * const results = await index.query({
 *    vector: [
 *     ... // query embedding
 *    ],
 *    filter: { genre: { '$eq': 'drama' }}
 * })
 * const movie = results.matches[0];
 *
 * if (movie.metadata) {
 *   // Since we passed the MovieMetadata type parameter above,
 *   // we can interact with metadata fields without having to
 *   // do any typecasting.
 *   const { title, runtime, genre } = movie.metadata;
 *   console.log(`The best match in drama was ${title}`)
 * }
 * ```
 *
 * @typeParam T - The type of metadata associated with each record.
 */
export class Index<T extends RecordMetadata = RecordMetadata> {
  /** @internal */
  private apiProvider: VectorOperationsProvider;

  /** @internal */
  private target: {
    /** The name of the index that will receive data operations when this class instance is used to upsert, update, query, or delete. */
    index: string;

    /** The namespace where operations will be performed. If not set, the default namespace of `''` will be used. */
    namespace: string;
  };

  /**
   * Delete all records from the targeted namespace. To delete all records from across all namespaces,
   * delete the index using {@link Pinecone.deleteIndex} and create a new one using {@link Pinecone.createIndex}.
   *
   * @example
   * ```js
   * const pinecone = new Pinecone();
   * await pinecone.index('my-index').describeIndexStats();
   * // {
   * //  namespaces: {
   * //    '': { recordCount: 10 },
   * //   foo: { recordCount: 1 }
   * //   },
   * //   dimension: 8,
   * //   indexFullness: 0,
   * //   totalRecordCount: 11
   * // }
   *
   * await pinecone.index('my-index').deleteAll();
   *
   * // Records in default namespace '' are now gone, but records in namespace 'foo' are not modified.
   * await client.index('my-index').describeIndexStats();
   * // {
   * //  namespaces: {
   * //   foo: { recordCount: 1 }
   * //   },
   * //   dimension: 8,
   * //   indexFullness: 0,
   * //   totalRecordCount: 1
   * // }
   *
   * ```
   * @returns A promise that resolves when the delete is completed.
   */
  deleteAll() {
    return this._deleteAll();
  }
  /** @hidden */
  private _deleteAll: ReturnType<typeof deleteAll>;

  /**
   * Delete records from the index by either an array of ids, or a filter object.
   * See [Filtering with metadata](https://docs.pinecone.io/docs/metadata-filtering#deleting-vectors-by-metadata-filter)
   * for more on deleting records with filters.
   *
   * @example
   * ```js
   * const pinecone = new Pinecone();
   * await pinecone.index('my-index').deleteMany(['record-1', 'record-2']);
   *
   * // or
   * await pinecone.index('my-index').deleteMany({ genre: 'classical' });
   * ```
   * @param options - An array of record id values or a filter object.
   * @returns A promise that resolves when the delete is completed.
   * @throws {@link Errors.PineconeArgumentError} when invalid arguments are passed.
   */
  deleteMany(options) {
    return this._deleteMany(options);
  }
  /** @hidden */
  _deleteMany: ReturnType<typeof deleteMany>;

  /**
   * Delete a record from the index by id.
   *
   * @example
   * ```js
   * const pinecone = new Pinecone();
   * await pinecone.index('my-index').deleteOne('record-1');
   * ```
   * @param id - The id of the record to delete.
   * @returns A promise that resolves when the delete is completed.
   * @throws {@link Errors.PineconeArgumentError} when invalid arguments are passed.
   */
  deleteOne(id) {
    return this._deleteOne(id);
  }
  /** @hidden */
  _deleteOne: ReturnType<typeof deleteOne>;

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
   * @returns A promise that resolve with the {@link IndexStatsDescription} value when the operation is completed.
   */
  describeIndexStats() {
    return this._describeIndexStats();
  }
  /** @hidden */
  _describeIndexStats: ReturnType<typeof describeIndexStats>;

  /** @hidden */
  private _fetchCommand: FetchCommand<T>;
  /** @hidden */
  private _queryCommand: QueryCommand<T>;
  /** @hidden */
  private _updateCommand: UpdateCommand<T>;
  /** @hidden */
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
   * @param indexName - The name of the index that will receive operations from this {@link Index} instance.
   * @param config - The configuration from the Pinecone client.
   * @param namespace - The namespace for the index.
   */
  constructor(
    indexName: string,
    apiProvider: VectorOperationsProvider,
    namespace = ''
  ) {
    this.target = {
      index: indexName,
      namespace: namespace,
    };
    this.apiProvider = apiProvider;

    this._deleteAll = deleteAll(apiProvider, namespace);
    this._deleteMany = deleteMany(apiProvider, namespace);
    this._deleteOne = deleteOne(apiProvider, namespace);
    this._describeIndexStats = describeIndexStats(apiProvider);

    this._fetchCommand = new FetchCommand<T>(apiProvider, namespace);
    this._queryCommand = new QueryCommand<T>(apiProvider, namespace);
    this._updateCommand = new UpdateCommand<T>(apiProvider, namespace);
    this._upsertCommand = new UpsertCommand<T>(apiProvider, namespace);
  }

  /**
   * Returns an {@link Index} targeting the specified namespace. By default, all operations take place inside the default namespace `''`.
   *
   * @example
   * ```js
   * const pinecone = new Pinecone();
   *
   * // Create an Index client instance scoped to operate on a
   * // single namespace
   * const ns = pinecone.index('my-index').namespace('my-namespace');
   *
   * // Now operations against this intance only affect records in
   * // the targeted namespace
   * ns.upsert([
   *   // ... records to upsert in namespace 'my-namespace'
   * ])
   *
   * ns.query({
   *   // ... query records in namespace 'my-namespace'
   * })
   * ```
   *
   * @param namespace - The namespace to target within the index. All operations performed with the returned client instance will be scoped only to the targeted namespace.
   *
   * This `namespace()` method will inherit custom metadata types if you are chaining the call off an { @link Index } client instance that is typed with a user-specified metadata type. See { @link Pinecone.index } for more info.
   */
  namespace(namespace: string): Index<T> {
    return new Index<T>(this.target.index, this.apiProvider, namespace);
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
   * Query records from the index. Query is used to find the `topK` records in the index whose vector values are most
   * similar to the vector values of the query according to the distance metric you have configured for your index.
   * See [Query data](https://docs.pinecone.io/docs/query-data) for more on querying.
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
