import { UpsertCommand, UpsertOptions } from './vectors/upsert';
import type { FetchOptions } from './vectors/fetch';
import { FetchCommand } from './vectors/fetch';
import {
  FetchByMetadataCommand,
  FetchByMetadataOptions,
} from './vectors/fetchByMetadata';
import type { UpdateOptions } from './vectors/update';
import { UpdateCommand } from './vectors/update';
import type { QueryOptions } from './vectors/query';
import { QueryCommand } from './vectors/query';
import type { DeleteOneOptions } from './vectors/deleteOne';
import { deleteOne } from './vectors/deleteOne';
import type { DeleteManyOptions } from './vectors/deleteMany';
import { deleteMany } from './vectors/deleteMany';
import { deleteAll, DeleteAllOptions } from './vectors/deleteAll';
import {
  describeIndexStats,
  DescribeIndexStatsOptions,
} from './vectors/describeIndexStats';
import { VectorOperationsProvider } from './vectors/vectorOperationsProvider';
import type { ListOptions } from './vectors/list';
import { listPaginated } from './vectors/list';
import {
  UpsertRecordsCommand,
  UpsertRecordsOptions,
} from './vectors/upsertRecords';
import {
  SearchRecordsCommand,
  SearchRecordsOptions,
} from './vectors/searchRecords';
import type { PineconeConfiguration, RecordMetadata } from './vectors/types';
import { StartImportCommand, StartImportOptions } from './bulk/startImport';
import { ListImportsCommand } from './bulk/listImports';
import { DescribeImportCommand } from './bulk/describeImport';
import { CancelImportCommand } from './bulk/cancelImport';
import { BulkOperationsProvider } from './bulk/bulkOperationsProvider';
import { NamespaceOperationsProvider } from './namespaces/namespacesOperationsProvider';
import { createNamespace } from './namespaces/createNamespace';
import type { CreateNamespaceOptions } from './namespaces/createNamespace';
import {
  listNamespaces,
  ListNamespacesOptions,
} from './namespaces/listNamespaces';
import { describeNamespace } from './namespaces/describeNamespace';
import { deleteNamespace } from './namespaces/deleteNamespace';
import { IndexOptions } from '../types';
import { PineconeArgumentError } from '../errors';

export type {
  OperationUsage,
  PineconeConfiguration,
  PineconeRecord,
  RecordId,
  RecordSparseValues,
  RecordValues,
  RecordMetadata,
  RecordMetadataValue,
  IntegratedRecord,
} from './vectors/types';
export type { DeleteManyOptions } from './vectors/deleteMany';
export type { DeleteOneOptions } from './vectors/deleteOne';
export type { DeleteAllOptions } from './vectors/deleteAll';
export type {
  DescribeIndexStatsOptions,
  IndexStatsDescription,
  IndexStatsNamespaceSummary,
} from './vectors/describeIndexStats';
export type { FetchOptions, FetchResponse } from './vectors/fetch';
export type {
  FetchByMetadataOptions,
  FetchByMetadataResponse,
} from './vectors/fetchByMetadata';
export type { UpdateOptions } from './vectors/update';
export type { UpsertOptions } from './vectors/upsert';
export type { UpsertRecordsOptions } from './vectors/upsertRecords';
export type {
  ScoredPineconeRecord,
  QueryByRecordId,
  QueryByVectorValues,
  QueryOptions,
  QueryResponse,
  QueryShared,
} from './vectors/query';
export type { ListOptions } from './vectors/list';
export type {
  SearchRecordsOptions,
  SearchRecordsQuery,
  SearchRecordsRerank,
  SearchRecordsVector,
} from './vectors/searchRecords';
export type { CreateNamespaceOptions } from './namespaces/createNamespace';
export type { ListNamespacesOptions } from './namespaces/listNamespaces';
export type { StartImportOptions } from './bulk/startImport';

/**
 * The `Index` class is used to perform data operations (upsert, query, etc)
 * against Pinecone indexes. Typically, it will be instantiated via a `Pinecone`
 * client instance that has already built the required configuration from a
 * combination of sources.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone()
 *
 * const indexModel = await pc.describeIndex('index-name');
 * const index = pc.index({ host: indexModel.host })
 * ```
 *
 * ### Targeting an index, with user-defined Metadata types
 *
 * If you are storing metadata alongside your vector values inside your Pinecone records, you can pass a type parameter to `index()` in order to get proper TypeScript typechecking when upserting and querying data.
 *
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 *
 * type MovieMetadata = {
 *   title: string,
 *   runtime: numbers,
 *   genre: 'comedy' | 'horror' | 'drama' | 'action'
 * }
 *
 * // Specify a custom metadata type while targeting the index
 * const index = pc.index<MovieMetadata>({ name: 'test-index' });
 *
 * // Now you get type errors if upserting malformed metadata
 * await index.upsert({
 *   records: [{
 *     id: '1234',
 *     values: [
 *       .... // embedding values
 *     ],
 *     metadata: {
 *       title: 'Gone with the Wind',
 *       runtime: 238,
 *       genre: 'drama',
 *
 *       // @ts-expect-error because category property not in MovieMetadata
 *       category: 'classic'
 *     }
 *   }]
 * })
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
  /** @hidden */
  _deleteMany: ReturnType<typeof deleteMany>;
  /** @hidden */
  _deleteOne: ReturnType<typeof deleteOne>;
  /** @hidden */
  _describeIndexStats: ReturnType<typeof describeIndexStats>;
  /** @hidden */
  _listPaginated: ReturnType<typeof listPaginated>;
  /** @hidden */
  private _deleteAll: ReturnType<typeof deleteAll>;
  /** @hidden */
  private _fetchCommand: FetchCommand<T>;
  /** @hidden */
  private _fetchByMetadataCommand: FetchByMetadataCommand<T>;
  /** @hidden */
  private _queryCommand: QueryCommand<T>;
  /** @hidden */
  private _updateCommand: UpdateCommand<T>;
  /** @hidden */
  private _upsertCommand: UpsertCommand<T>;
  /** @hidden */
  private _upsertRecordsCommand: UpsertRecordsCommand<T>;
  /** @hidden */
  private _searchRecordsCommand: SearchRecordsCommand;
  /** @hidden */
  private _startImportCommand: StartImportCommand;
  /** @hidden */
  private _listImportsCommand: ListImportsCommand;
  /** @hidden */
  private _describeImportCommand: DescribeImportCommand;
  /** @hidden */
  private _cancelImportCommand: CancelImportCommand;
  /** @hidden */
  private _createNamespaceCommand: ReturnType<typeof createNamespace>;
  /** @hidden */
  private _listNamespacesCommand: ReturnType<typeof listNamespaces>;
  /** @hidden */
  private _describeNamespaceCommand: ReturnType<typeof describeNamespace>;
  /** @hidden */
  private _deleteNamespaceCommand: ReturnType<typeof deleteNamespace>;

  /** @internal */
  private config: PineconeConfiguration;
  /** @internal */
  private target: {
    /** The name of the index that will receive data operations when this class instance is used to upsert, update, query, or delete. */
    indexName: string;

    /** The namespace where operations will be performed. If not set, the default namespace of `''` will be used. */
    namespace: string;

    /** An optional host address override for data operations. */
    indexHostUrl?: string;
  };

  /**
   * Instantiation of Index is handled by {@link Pinecone}
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * // Get host from describeIndex
   * const indexModel = await pc.describeIndex('my-index');
   * const index = pc.index({ host: indexModel.host });
   *
   * // Or get host from createIndex response
   * const indexModel = await pc.createIndex({
   *   name: 'my-index',
   *   dimension: 1536,
   *   spec: { serverless: { cloud: 'aws', region: 'us-east-1' } }
   * });
   * const index = pc.index({ host: indexModel.host });
   * ```
   *
   * @constructor
   * @param options - The {@link IndexOptions} for targeting the index.
   * @param config - The configuration from the Pinecone client.
   */
  constructor(options: IndexOptions, config: PineconeConfiguration) {
    if (!options.name && !options.host) {
      throw new PineconeArgumentError(
        'Either name or host must be provided in IndexOptions',
      );
    }

    this.config = config;
    this.target = {
      indexName: options.name || '',
      namespace: options.namespace || '__default__',
      indexHostUrl: options.host,
    };

    // vector & record operations
    const dataOperationsProvider = new VectorOperationsProvider(
      config,
      this.target.indexName,
      this.target.indexHostUrl,
      options.additionalHeaders,
    );
    this._deleteAll = deleteAll(dataOperationsProvider, this.target.namespace);
    this._deleteMany = deleteMany(
      dataOperationsProvider,
      this.target.namespace,
    );
    this._deleteOne = deleteOne(dataOperationsProvider, this.target.namespace);
    this._describeIndexStats = describeIndexStats(dataOperationsProvider);
    this._listPaginated = listPaginated(
      dataOperationsProvider,
      this.target.namespace,
    );
    this._fetchCommand = new FetchCommand<T>(
      dataOperationsProvider,
      this.target.namespace,
    );
    this._fetchByMetadataCommand = new FetchByMetadataCommand<T>(
      dataOperationsProvider,
      this.target.namespace,
    );
    this._queryCommand = new QueryCommand<T>(
      dataOperationsProvider,
      this.target.namespace,
    );
    this._updateCommand = new UpdateCommand<T>(
      dataOperationsProvider,
      this.target.namespace,
    );
    this._upsertCommand = new UpsertCommand<T>(
      dataOperationsProvider,
      this.target.namespace,
    );
    this._upsertRecordsCommand = new UpsertRecordsCommand<T>(
      dataOperationsProvider,
      this.target.namespace,
      config,
    );
    this._searchRecordsCommand = new SearchRecordsCommand(
      dataOperationsProvider,
      this.target.namespace,
    );

    // bulk operations
    const bulkApiProvider = new BulkOperationsProvider(
      config,
      this.target.indexName,
      this.target.indexHostUrl,
      options.additionalHeaders,
    );
    this._startImportCommand = new StartImportCommand(bulkApiProvider);
    this._listImportsCommand = new ListImportsCommand(bulkApiProvider);
    this._describeImportCommand = new DescribeImportCommand(bulkApiProvider);
    this._cancelImportCommand = new CancelImportCommand(bulkApiProvider);

    // namespace operations
    const namespaceApiProvider = new NamespaceOperationsProvider(
      config,
      this.target.indexName,
      this.target.indexHostUrl,
      options.additionalHeaders,
    );
    this._createNamespaceCommand = createNamespace(namespaceApiProvider);
    this._listNamespacesCommand = listNamespaces(namespaceApiProvider);
    this._describeNamespaceCommand = describeNamespace(namespaceApiProvider);
    this._deleteNamespaceCommand = deleteNamespace(namespaceApiProvider);
  }

  /**
   * Delete all records from the targeted namespace. To delete all records from across all namespaces,
   * delete the index using {@link Pinecone.deleteIndex} and create a new one using {@link Pinecone.createIndex}.
   *
  * @example
  * ```js
  * import { Pinecone } from '@pinecone-database/pinecone';
  * const pc = new Pinecone();
  * const indexModel = await pc.describeIndex('my-index');
  * const index = pc.index({ host: indexModel.host });
  *
  * await index.describeIndexStats();
  * // {
  * //  namespaces: {
  * //    '': { recordCount: 10 },
  * //   foo: { recordCount: 1 }
  * //   },
  * //   dimension: 8,
  * //   indexFullness: 0,
  * //   totalRecordCount: 11
  * // }
  * // Deletes all records from the default namespace '__default__'. Records in other namespaces are not modified.
  * await index.deleteAll();
  *
  * // Deletes all records from the namespace 'foo'. Records in other namespaces are not modified.
  * await index.deleteAll({ namespace: 'foo' });
  *

  * ```
   * @param options - Optional {@link DeleteAllOptions} for the operation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the delete is completed.
   */
  deleteAll(options?: DeleteAllOptions) {
    return this._deleteAll(options);
  }

  /**
   * Delete records from the index by either an array of ids, or a filter object.
   * See [Filtering with metadata](https://docs.pinecone.io/docs/metadata-filtering#deleting-vectors-by-metadata-filter)
   * for more on deleting records with filters.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('my-index');
   * const index = pc.index({ host: indexModel.host });
   *
   * await index.deleteMany({ ids: ['record-1', 'record-2'] });
   *
   * // or
   * await index.deleteMany({ filter: { genre: 'classical' } });
   * ```
   * @param options - The {@link DeleteManyOptions} for the operation.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the delete is completed.
   */
  deleteMany(options: DeleteManyOptions) {
    return this._deleteMany(options);
  }

  /**
   * Delete a record from the index by id.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('my-index');
   * const index = pc.index({ host: indexModel.host });
   *
   * await index.deleteOne({ id: 'record-1', namespace: 'foo' });
   * ```
   * @param options - The {@link DeleteOneOptions} for the operation.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the delete is completed.
   */
  deleteOne(options: DeleteOneOptions) {
    return this._deleteOne(options);
  }

  /**
   * Describes the index's statistics such as total number of records, records per namespace, and the index's dimension size.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('my-index');
   * const index = pc.index({ host: indexModel.host });
   *
   * await index.describeIndexStats();
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
   * @param options - The {@link DescribeIndexStatsOptions} for the operation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves with the {@link IndexStatsDescription} value when the operation is completed.
   */
  describeIndexStats(options?: DescribeIndexStatsOptions) {
    return this._describeIndexStats(options);
  }

  /**
   * The `listPaginated` operation finds vectors based on an id prefix within a single namespace.
   * It returns matching ids in a paginated form, with a pagination token to fetch the next page of results.
   * This id list can then be passed to fetch or delete options to perform operations on the matching records.
   * See [Get record IDs](https://docs.pinecone.io/docs/get-record-ids) for guidance and examples.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexModel = await pc.describeIndex('my-index');
   * const index = pc.index({ host: indexModel.host, namespace: 'my-namespace' });
   *
   * const results = await index.listPaginated({ prefix: 'doc1#' });
   * console.log(results);
   * // {
   * //   vectors: [
   * //     { id: 'doc1#01' }, { id: 'doc1#02' }, { id: 'doc1#03' },
   * //     { id: 'doc1#04' }, { id: 'doc1#05' },  { id: 'doc1#06' },
   * //     { id: 'doc1#07' }, { id: 'doc1#08' }, { id: 'doc1#09' },
   * //     ...
   * //   ],
   * //   pagination: {
   * //     next: 'eyJza2lwX3Bhc3QiOiJwcmVUZXN0LS04MCIsInByZWZpeCI6InByZVRlc3QifQ=='
   * //   },
   * //   namespace: 'my-namespace',
   * //   usage: { readUnits: 1 }
   * // }
   *
   * // Fetch the next page of results
   * await index.listPaginated({ prefix: 'doc1#', paginationToken: results.pagination.next});
   * ```
   *
   * > ⚠️ **Note:**
   * >
   * > `listPaginated` is supported only for serverless indexes.
   *
   * @param options - The {@link ListOptions} for the operation.
   * @returns - A promise that resolves with the {@link ListResponse} when the operation is completed.
   * @throws {@link Errors.PineconeConnectionError} when invalid environment, project id, or index name is configured.
   * @throws {@link Errors.PineconeArgumentError} when invalid arguments are passed.
   */
  listPaginated(options?: ListOptions) {
    return this._listPaginated(options);
  }

  /**
   * Upsert records to the index.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('my-index');
   * const index = pc.index({ host: indexModel.host });
   *
   * // Upsert to default namespace
   * await index.upsert({
   *   records: [{
   *     id: 'record-1',
   *     values: [0.176, 0.345, 0.263],
   *   },{
   *     id: 'record-2',
   *     values: [0.176, 0.345, 0.263],
   *   }]
   * })
   *
   * // Upsert to a different namespace
   * await index.upsert({
   *   records: [{
   *     id: 'record-3',
   *     values: [0.176, 0.345, 0.263],
   *   }],
   *   namespace: 'my-namespace'
   * })
   * ```
   *
   * @param options - The {@link UpsertOptions} for the operation.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the upsert is completed.
   */
  async upsert(options: UpsertOptions<T>) {
    return await this._upsertCommand.run(options);
  }

  /**
   * Fetch records from the index.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('my-index');
   * const index = pc.index({ host: indexModel.host });
   *
   * // Fetch from default namespace
   * await index.fetch({ ids: ['record-1', 'record-2'] });
   *
   * // Override namespace for this operation
   * await index.fetch({ ids: ['record-1', 'record-2'], namespace: 'my-namespace' });
   * ```
   * @param options - The {@link FetchOptions} for the operation.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves with the {@link FetchResponse} when the fetch is completed.
   */
  async fetch(options: FetchOptions) {
    return await this._fetchCommand.run(options);
  }

  /**
   * Fetch records from the index by metadata filter.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('my-index');
   * const index = pc.index({ host: indexModel.host });
   *
   * await index.fetchByMetadata({ filter: { genre: 'classical' } });
   * ```
   *
   * @param options - The {@link FetchByMetadataOptions} for the operation.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves with the {@link FetchByMetadataResponse} when the fetch is completed.
   */
  async fetchByMetadata(options: FetchByMetadataOptions) {
    return await this._fetchByMetadataCommand.run(options);
  }

  /**
   * Query records from the index. Query is used to find the `topK` records in the index whose vector values are most
   * similar to the vector values of the query according to the distance metric you have configured for your index.
   * See [Query data](https://docs.pinecone.io/docs/query-data) for more on querying.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('my-index');
   * const index = pc.index({ host: indexModel.host });
   *
   * // Query by id
   * await index.query({ topK: 3, id: 'record-1'});
   *
   * // Query by vector
   * await index.query({ topK: 3, vector: [0.176, 0.345, 0.263] });
   *
   * // Query a different namespace
   * await index.query({ topK: 3, id: 'record-1', namespace: 'custom-namespace' });
   * ```
   *
   * @param options - The {@link QueryOptions} for the operation.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves with the {@link QueryResponse} when the query is completed.
   */
  async query(options: QueryOptions) {
    return await this._queryCommand.run(options);
  }

  /**
   * Update a record in the index by id.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('imdb-movies');
   * const index = pc.index({ host: indexModel.host });
   *
   * await index.update({
   *   id: '18593',
   *   metadata: { genre: 'romance' },
   * });
   * ```
   *
   * @param options - The {@link UpdateOptions} for the operation.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves when the update is completed.
   */
  async update(options: UpdateOptions<T>) {
    return await this._updateCommand.run(options);
  }

  /**
   * Upsert integrated records into a specific namespace within an index.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * const indexModel = await pc.describeIndex('integrated-index');
   * const namespace = pc.index({ host: indexModel.host, namespace: 'my-namespace' });
   *
   * await namespace.upsertRecords({
   *   records: [
   *     {
   *       id: 'rec1',
   *       chunk_text:
   *         "Apple's first product, the Apple I, was released in 1976 and was hand-built by co-founder Steve Wozniak.",
   *       category: 'product',
   *     },
   *     {
   *       id: 'rec2',
   *       chunk_text:
   *         'Apples are a great source of dietary fiber, which supports digestion and helps maintain a healthy gut.',
   *       category: 'nutrition',
   *     },
   *     {
   *       id: 'rec3',
   *       chunk_text:
   *         'Apples originated in Central Asia and have been cultivated for thousands of years, with over 7,500 varieties available today.',
   *       category: 'cultivation',
   *     },
   *     {
   *       id: 'rec4',
   *       chunk_text:
   *         'In 2001, Apple released the iPod, which transformed the music industry by making portable music widely accessible.',
   *       category: 'product',
   *     },
   *     {
   *       id: 'rec5',
   *       chunk_text:
   *         'Apple went public in 1980, making history with one of the largest IPOs at that time.',
   *       category: 'milestone',
   *     },
   *     {
   *       id: 'rec6',
   *       chunk_text:
   *         'Rich in vitamin C and other antioxidants, apples contribute to immune health and may reduce the risk of chronic diseases.',
   *       category: 'nutrition',
   *     },
   *     {
   *       id: 'rec7',
   *       chunk_text:
   *         "Known for its design-forward products, Apple's branding and market strategy have greatly influenced the technology sector and popularized minimalist design worldwide.",
   *       category: 'influence',
   *     },
   *     {
   *       id: 'rec8',
   *       chunk_text:
   *         'The high fiber content in apples can also help regulate blood sugar levels, making them a favorable snack for people with diabetes.',
   *       category: 'nutrition',
   *     },
   *   ]
   * });
   * ```
   *
   * @param options - The {@link UpsertRecordsOptions} for the operation.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns a promise that resolves when the operation is complete.
   */
  async upsertRecords(options: UpsertRecordsOptions<T>) {
    return await this._upsertRecordsCommand.run(options);
  }

  /**
   * Search a specific namespace for records within an index.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('integrated-index');
   * const namespace = pc.index({ host: indexModel.host, namespace: 'my-namespace' });
   *
   * const response = await namespace.searchRecords({
   *   query: {
   *     inputs: { text: 'disease prevention' }, topK: 4 },
   *     rerank: {
   *       model: 'bge-reranker-v2-m3',
   *       topN: 2,
   *       rankFields: ['chunk_text'],
   *     },
   *   fields: ['category', 'chunk_text'],
   * });
   * console.log(response);
   * // {
   * //   "result": {
   * //     "hits": [
   * //       {
   * //         "id": "rec6",
   * //         "score": 0.1318424493074417,
   * //         "fields": {
   * //           "category": "nutrition",
   * //           "chunk_text": "Rich in vitamin C and other antioxidants, apples contribute to immune health and may reduce the risk of chronic diseases."
   * //         }
   * //       },
   * //       {
   * //         "id": "rec2",
   * //         "score": 0.004867417272180319,
   * //         "fields": {
   * //           "category": "nutrition",
   * //           "chunk_text": "Apples are a great source of dietary fiber, which supports digestion and helps maintain a healthy gut."
   * //         }
   * //       }
   * //     ]
   * //   },
   * //   "usage": {
   * //     "readUnits": 1,
   * //     "embedTotalTokens": 8,
   * //     "rerankUnits": 1
   * //   }
   * // }
   * ```
   *
   * @param options - The {@link SearchRecordsOptions} for the operation.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns a promise that resolves to {@link SearchRecordsResponse} when the operation is complete.
   */
  async searchRecords(options: SearchRecordsOptions) {
    return await this._searchRecordsCommand.run(options);
  }

  /**
   * Start an asynchronous import of vectors from object storage into a Pinecone Serverless index.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('my-serverless-index');
   * const index = pc.index({ host: indexModel.host });
   * console.log(await index.startImport({ uri: 's3://my-bucket/my-data' }));
   *
   * // {"id":"1"}
   * ```
   *
   * @param options - The {@link StartImportOptions} for the import operation.
   * @throws {@link Errors.PineconeArgumentError} when arguments passed to the method fail a runtime validation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to {@link StartImportResponse} when the import operation is started.
   */
  async startImport(options: StartImportOptions) {
    return await this._startImportCommand.run(options);
  }

  /**
   * List all recent and ongoing import operations.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('my-serverless-index');
   * const index = pc.index({ host: indexModel.host });
   * console.log(await index.listImports(10));
   *
   * // {
   * //  data: [
   * //    {
   * //      id: '1',
   * //      uri: 's3://dev-bulk-import-datasets-pub/10-records-dim-10',
   * //      status: 'Completed',
   * //      createdAt: 2024-09-17T16:59:57.973Z,
   * //      finishedAt: 2024-09-17T17:00:12.809Z,
   * //      percentComplete: 100,
   * //      recordsImported: 20,
   * //      error: undefined
   * //    }
   * //  ],
   * //  pagination: undefined  // Example is only 1 item, so no pag. token given.
   * // }
   * ```
   *
   * @param limit - (Optional) Max number of import operations to return per page.
   * @param paginationToken - (Optional) Pagination token to continue a previous listing operation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link ListImportsResponse} when the operation is complete.
   */
  async listImports(limit?: number, paginationToken?: string) {
    return await this._listImportsCommand.run(limit, paginationToken);
  }

  /**
   * Return details of a specific import operation.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('my-serverless-index');
   * const index = pc.index({ host: indexModel.host });
   * console.log(await index.describeImport('import-id'));
   *
   * // {
   * //  id: '1',
   * //  uri: 's3://dev-bulk-import-datasets-pub/10-records-dim-10',
   * //  status: 'Completed',
   * //  createdAt: 2024-09-17T16:59:57.973Z,
   * //  finishedAt: 2024-09-17T17:00:12.809Z,
   * //  percentComplete: 100,
   * //  recordsImported: 20,
   * //  error: undefined
   * // }
   * ```
   *
   * @param id - The id of the import operation to describe.
   */
  async describeImport(id: string) {
    return await this._describeImportCommand.run(id);
  }

  /**
   * Cancel a specific import operation.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('my-serverless-index');
   * const index = pc.index({ host: indexModel.host });
   * console.log(await index.cancelImport('import-id'));
   *
   * // {}
   * ```
   *
   * @param id - The id of the import operation to cancel.
   */
  async cancelImport(id: string) {
    return await this._cancelImportCommand.run(id);
  }

  /**
   * Creates a new namespace within the index with an optional metadata schema.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('my-serverless-index');
   * const index = pc.index({ host: indexModel.host });
   * await index.createNamespace({
   *   name: 'my-namespace',
   *   schema: {
   *     fields: {
   *       genre: { filterable: true },
   *       year: { filterable: true }
   *     }
   *   }
   * });
   * ```
   *
   * @param options - Configuration options for creating the namespace.
   * @param options.name - (Required) The name of the namespace to create.
   * @param options.schema - (Optional) The metadata schema for the namespace. By default, all metadata is indexed;
   * when a schema is present, only fields which are present in the `fields` object with `filterable: true` are indexed.
   */
  async createNamespace(options: CreateNamespaceOptions) {
    return await this._createNamespaceCommand(options);
  }

  /**
   * Returns a list of namespaces within the index.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('my-serverless-index');
   * const index = pc.index({ host: indexModel.host });
   * console.log(await index.listNamespaces({ limit: 10 }));
   *
   * // {
   * //   namespaces: [
   * //     { name: 'ns-1', recordCount: '1' },
   * //     { name: 'ns-2', recordCount: '1' }
   * //   ],
   * //   pagination: undefined
   * // }
   * ```
   *
   * @param options - The {@link ListNamespacesOptions} for the operation.
   * @throws {@link Errors.PineconeConnectionError} when network problems or an outage of Pinecone's APIs prevent the request from being completed.
   * @returns A promise that resolves to a {@link ListNamespacesResponse} when the operation is complete.
   */
  async listNamespaces(options?: ListNamespacesOptions) {
    return await this._listNamespacesCommand(options);
  }

  /**
   * Returns the details of a specific namespace.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('my-serverless-index');
   * const index = pc.index({ host: indexModel.host });
   * console.log(await index.describeNamespace('ns-1'));
   *
   * // { name: 'ns-1', recordCount: '1' }
   * ```
   *
   * @param namespace - The namespace to describe.
   */
  async describeNamespace(namespace: string) {
    return await this._describeNamespaceCommand(namespace);
  }

  /**
   * Deletes a specific namespace from the index, including all records within it.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const indexModel = await pc.describeIndex('my-serverless-index');
   * const index = pc.index({ host: indexModel.host });
   * await index.deleteNamespace('ns-1');
   * ```
   *
   * @param namespace - The namespace to delete.
   */
  async deleteNamespace(namespace: string) {
    return await this._deleteNamespaceCommand(namespace);
  }

  /**
   * Returns an {@link Index} targeting the specified namespace.
   * By default if no namespace is provided, all operations take place inside the default namespace `'__default__'`.
   *
   * @example
   * ```js
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   *
   * // Create an Index client instance scoped to operate on a
   * // single namespace
   * const ns = pc.index('my-index').namespace('my-namespace');
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
   * This `namespace()` method will inherit custom metadata types if you are chaining the call off an {@link Index} client instance that is typed with a user-specified metadata type. See {@link Pinecone.index} for more info.
   *
   * @param namespace - The namespace to target within the index. All operations performed with the returned client instance will be scoped only to the targeted namespace.
   * @returns An {@link Index} object that can be used to perform data operations scoped to the specified namespace.
   */
  namespace(namespace: string): Index<T> {
    return new Index<T>(
      {
        name: this.target.indexName,
        namespace,
        host: this.target.indexHostUrl,
        additionalHeaders: this.config.additionalHeaders,
      },
      this.config,
    );
  }
}
