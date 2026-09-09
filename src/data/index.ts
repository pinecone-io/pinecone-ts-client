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
import { mergeAdditionalHeaders } from '../utils/additionalHeaders';
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
import { DocumentOperationsProvider } from './documents/documentOperationsProvider';
import { Documents } from './documents/documents';
import type {
  UpsertDocumentsOptions,
  UpsertDocumentsResponse,
} from './documents/upsertDocuments';
import type {
  SearchDocumentsOptions,
  SearchDocumentsResponse,
} from './documents/searchDocuments';
import type {
  FetchDocumentsOptions,
  FetchDocumentsResponse,
} from './documents/fetchDocuments';
import type {
  DeleteDocumentsOptions,
  DeleteDocumentsResponse,
} from './documents/deleteDocuments';
import type {
  ListDocumentsOptions,
  ListDocumentsResponse,
} from './documents/listDocuments';
import type {
  UpdateDocumentsOptions,
  UpdateDocumentsResponse,
} from './documents/updateDocuments';
import { createNamespace } from './namespaces/createNamespace';
import type { CreateNamespaceOptions } from './namespaces/createNamespace';
import {
  listNamespaces,
  ListNamespacesOptions,
} from './namespaces/listNamespaces';
import { describeNamespace } from './namespaces/describeNamespace';
import { deleteNamespace } from './namespaces/deleteNamespace';
import { IndexOptions } from '../types';
import type { HTTPHeaders } from '../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../errors';

export { Documents } from './documents/documents';

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
export type {
  DocumentRecord,
  UpsertDocumentsOptions,
  UpsertDocumentsResponse,
} from './documents/upsertDocuments';
export type {
  DocumentScoringMethod,
  SearchDocumentsOptions,
  DocumentSearchMatch,
  SearchDocumentsResponse,
  DocumentSearchUsage,
  SparseValues,
} from './documents/searchDocuments';
export type {
  FetchDocumentsOptions,
  FetchedDocument,
  FetchDocumentsResponse,
  DocumentFetchUsage,
} from './documents/fetchDocuments';
export type {
  DeleteDocumentsOptions,
  DeleteDocumentsResponse,
} from './documents/deleteDocuments';
export type {
  ListDocumentsOptions,
  ListDocumentsResponse,
  ListedDocumentRecord,
  DocumentListUsage,
  DocumentPagination,
} from './documents/listDocuments';
export type {
  UpdateDocumentsOptions,
  UpdateDocumentsResponse,
  UpdateDocumentRecord,
} from './documents/updateDocuments';

/**
 * A client for reading and writing records in a Pinecone index.
 * Obtain an instance with {@link Pinecone.index}; do not construct it directly.
 * Vector methods accept embeddings, while document methods use fields declared in a schema-based
 * index.
 *
 * @typeParam T - Metadata fields stored with vector records; omitted for flexible metadata.
 *
 * @example
 * ```typescript
 * import { Pinecone } from '@pinecone-database/pinecone';
 * const pc = new Pinecone();
 * type ProductMetadata = { title: string; category: string };
 * const index = pc.index<ProductMetadata>({ name: 'product-catalog', namespace: 'products-en' });
 * const result = await index.fetch({ ids: ['trail-shoe-42'] });
 * console.log(result.records['trail-shoe-42']?.metadata?.title);
 * ```
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
  /**
   * Document operations for a schema-based index, scoped to this client's namespace.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-documents', namespace: 'products-en' });
   * const result = await index.documents.fetch({ ids: ['trail-shoe-42'] });
   * console.log(result.documents);
   * ```
   */
  public documents: Documents;

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
   * The per-index headers this instance was constructed with, retained so that
   * {@link Index.namespace} can carry them forward to the new instance.
   *
   * @internal
   */
  private additionalHeaders?: HTTPHeaders;

  /**
   * Create index clients through {@link Pinecone.index}.
   *
   * @internal
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
    this.additionalHeaders = mergeAdditionalHeaders(
      config.additionalHeaders,
      options.additionalHeaders,
    );

    // vector & record operations
    const dataOperationsProvider = new VectorOperationsProvider(
      config,
      this.target.indexName,
      this.target.indexHostUrl,
      this.additionalHeaders,
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
      this.additionalHeaders,
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
      this.additionalHeaders,
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
      this.additionalHeaders,
    );
    this._createNamespaceCommand = createNamespace(namespaceApiProvider);
    this._listNamespacesCommand = listNamespaces(namespaceApiProvider);
    this._describeNamespaceCommand = describeNamespace(namespaceApiProvider);
    this._deleteNamespaceCommand = deleteNamespace(namespaceApiProvider);

    // document operations
    const documentApiProvider = new DocumentOperationsProvider(
      config,
      this.target.indexName,
      this.target.indexHostUrl,
      this.additionalHeaders,
    );
    this.documents = new Documents(documentApiProvider, this.target.namespace);
  }

  /**
   * Delete all records in one namespace.
   *
   * Records in other namespaces are unaffected.
   *
   * @param options - Override the configured namespace; omit to use this client's namespace.
   * @returns Resolves when the delete request succeeds.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * await index.deleteAll();
   * ```
   *
   * @see {@link Index.deleteMany} to select records by IDs or metadata.
   */
  deleteAll(options?: DeleteAllOptions) {
    return this._deleteAll(options);
  }

  /**
   * Delete records selected by IDs or a metadata filter.
   *
   * @param options - Provide either `ids`, such as `['trail-shoe-42']`, or `filter`, and optionally
   * a namespace override.
   * @returns Resolves when the delete request succeeds.
   * @throws {@link Errors.PineconeArgumentError} when the record selection is missing or invalid.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * await index.deleteMany({ ids: ['trail-shoe-42', 'trail-shoe-43'] });
   * ```
   *
   * @see {@link Index.deleteAll} to remove every record in a namespace.
   */
  deleteMany(options: DeleteManyOptions) {
    return this._deleteMany(options);
  }

  /**
   * Delete a record by ID.
   *
   * @param options - The record ID, such as `trail-shoe-42`, and an optional namespace override.
   * @returns Resolves when the delete request succeeds.
   * @throws {@link Errors.PineconeArgumentError} when `id` is empty or missing.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * await index.deleteOne({ id: 'trail-shoe-42' });
   * ```
   *
   * @see {@link Index.deleteMany} to delete multiple records.
   */
  deleteOne(options: DeleteOneOptions) {
    return this._deleteOne(options);
  }

  /**
   * Get record counts and dimensions for the index.
   *
   * @param options - A metadata filter to restrict the statistics; omit for statistics across the
   * index.
   * @returns Index statistics, including `namespaces` with per-namespace counts and
   * `totalRecordCount`.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * const stats = await index.describeIndexStats();
   * console.log(stats.totalRecordCount, stats.namespaces);
   * ```
   */
  describeIndexStats(options?: DescribeIndexStatsOptions) {
    return this._describeIndexStats(options);
  }

  /**
   * List one page of record IDs in a namespace.
   *
   * Supported for serverless indexes.
   *
   * @param options - An ID prefix, page size, continuation token, or namespace override; omit for
   * the first unfiltered page.
   * @returns Record IDs in `vectors` and `pagination.next` when another page is available.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * const page = await index.listPaginated({ prefix: 'trail-shoe-' });
   * console.log(page.vectors);
   * if (page.pagination?.next) {
   *   const nextPage = await index.listPaginated({
   *     prefix: 'trail-shoe-', paginationToken: page.pagination.next,
   *   });
   *   console.log(nextPage.vectors);
   * }
   * ```
   *
   * @see {@link Index.fetch} to retrieve values and metadata for known IDs.
   */
  listPaginated(options?: ListOptions) {
    return this._listPaginated(options);
  }

  /**
   * Insert vector records, replacing records with the same IDs.
   *
   * The example assumes a three-dimensional dense index; use embeddings that match your index.
   *
   * @param options - Records with IDs and dense or sparse values, plus an optional namespace
   * override.
   * @returns Resolves when the upsert request succeeds.
   * @throws {@link Errors.PineconeArgumentError} when records are empty or a record is missing its
   * ID or vector values.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * await index.upsert({
   *   records: [{ id: 'trail-shoe-42', values: [0.12, 0.34, 0.56],
   *     metadata: { category: 'footwear' } }],
   * });
   * ```
   *
   * @see {@link Index.upsertRecords} to embed text; {@link Index.update} for partial changes.
   */
  async upsert(options: UpsertOptions<T>) {
    return await this._upsertCommand.run(options);
  }

  /**
   * Fetch vector records by ID.
   *
   * @param options - Non-empty record IDs, such as `['trail-shoe-42']`, and an optional namespace
   * override.
   * @returns Records keyed by ID in `records`, the namespace, and usage information when available.
   * @throws {@link Errors.PineconeArgumentError} when `ids` is missing or empty.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * const result = await index.fetch({ ids: ['trail-shoe-42'] });
   * console.log(result.records['trail-shoe-42']);
   * ```
   *
   * @see {@link Index.fetchByMetadata} to select records with a filter; {@link Documents.fetch} for
   * schema-based documents.
   */
  async fetch(options: FetchOptions) {
    return await this._fetchCommand.run(options);
  }

  /**
   * Fetch one page of vector records matching a metadata filter.
   *
   * @param options - The metadata filter, optional page size and continuation token, and namespace
   * override.
   * @returns Records keyed by ID, the namespace, and `pagination.next` when another page is
   * available.
   * @throws {@link Errors.PineconeArgumentError} when `filter` is missing.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * const page = await index.fetchByMetadata({ filter: { category: { $eq: 'footwear' } } });
   * console.log(page.records);
   * ```
   *
   * @see {@link Index.fetch} to retrieve records by ID.
   */
  async fetchByMetadata(options: FetchByMetadataOptions) {
    return await this._fetchByMetadataCommand.run(options);
  }

  /**
   * Find vector records most similar to a query vector or an existing record.
   *
   * @param options - The result count `topK` and either `id` or `vector`, with optional filtering
   * and returned values or metadata.
   * @returns Matches ordered by similarity, the namespace, and usage information when available.
   * @throws {@link Errors.PineconeArgumentError} when query values, filters, or search tuning
   * options fail validation.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * const result = await index.query({
   *   id: 'trail-shoe-42', topK: 5, includeMetadata: true,
   * });
   * console.log(result.matches);
   * ```
   *
   * @see {@link Index.searchRecords} for text queries and reranking; {@link Documents.search} for
   * schema-based search.
   */
  async query(options: QueryOptions) {
    return await this._queryCommand.run(options);
  }

  /**
   * Update vector values or metadata on existing records.
   *
   * Updating metadata leaves unspecified metadata fields and vector values unchanged.
   *
   * @param options - Select a record with `id` to change vectors or metadata, or use `filter` to
   * change metadata on matching records; optionally override the namespace.
   * @returns Resolves when the update request succeeds.
   * @throws {@link Errors.PineconeArgumentError} when neither or both of `id` and `filter` are
   * provided.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * await index.update({
   *   id: 'trail-shoe-42', metadata: { category: 'hiking-footwear' },
   * });
   * ```
   *
   * @see {@link Index.upsert} to replace whole records; {@link Documents.update} for schema-based
   * documents.
   */
  async update(options: UpdateOptions<T>) {
    return await this._updateCommand.run(options);
  }

  /**
   * Write text records to an index with integrated embedding.
   *
   * The example assumes the index maps its embedding input to `chunk_text`.
   *
   * @param options - Records with `id` or `_id`, the text field configured in the index field map,
   * and optional metadata or namespace override.
   * @returns Resolves when the upsert request succeeds.
   * @throws {@link Errors.PineconeArgumentError} when a record has neither `id` nor `_id`.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-search', namespace: 'products-en' });
   *
   * await index.upsertRecords({
   *   records: [{ _id: 'trail-shoe-42', chunk_text: 'Waterproof hiking shoe with a durable sole.',
   *     category: 'footwear' }],
   * });
   * ```
   *
   * @see {@link Index.upsert} for precomputed vectors; {@link Documents.upsert} for schema-based
   * documents.
   */
  async upsertRecords(options: UpsertRecordsOptions<T>) {
    return await this._upsertRecordsCommand.run(options);
  }

  /**
   * Search records with text, a vector, or an existing record ID.
   *
   * Text queries require an index with integrated embedding.
   *
   * @param options - A query with `topK`, optional result fields, reranking settings, and a
   * namespace override.
   * @returns Ranked hits in `result.hits` and usage information.
   * @throws {@link Errors.PineconeArgumentError} when `query` is missing.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-search', namespace: 'products-en' });
   *
   * const result = await index.searchRecords({
   *   query: { inputs: { text: 'waterproof hiking shoes' }, topK: 5 },
   *   fields: ['chunk_text', 'category'],
   * });
   * console.log(result.result.hits);
   * ```
   *
   * @see {@link Index.query} for vector similarity queries; {@link Documents.search} for
   * schema-based search.
   */
  async searchRecords(options: SearchRecordsOptions) {
    return await this._searchRecordsCommand.run(options);
  }

  /**
   * Start an asynchronous import of vectors from object storage.
   *
   * Requires a serverless index. The response does not wait for the import to finish.
   *
   * @param options - The import directory URI, optional storage integration, and error handling
   * mode (defaults to `continue`).
   * @returns The import ID in `id`; use it to check progress.
   * @throws {@link Errors.PineconeArgumentError} when `uri` is missing or `errorMode` is
   * unsupported.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * const operation = await index.startImport({ uri: 's3://product-data/catalog-import' });
   * console.log(operation.id);
   * ```
   *
   * @see {@link Index.describeImport} to check progress.
   */
  async startImport(options: StartImportOptions) {
    return await this._startImportCommand.run(options);
  }

  /**
   * List one page of recent and ongoing import operations.
   *
   * @param limit - Maximum operations per page, such as `10`; omit for the service default.
   * @param paginationToken - The previous response's `pagination.next`; omit for the first page.
   * @returns Import operations in `data` and `pagination.next` when another page is available.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * const page = await index.listImports(10);
   * console.log(page.data);
   * ```
   *
   * @see {@link Index.describeImport} for one import's progress.
   */
  async listImports(limit?: number, paginationToken?: string) {
    return await this._listImportsCommand.run(limit, paginationToken);
  }

  /**
   * Get the status and progress of an import operation.
   *
   * @param id - The import ID returned by {@link Index.startImport}.
   * @returns Import details, including `status`, `percentComplete`, and `recordsImported`.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * const operation = await index.startImport({ uri: 's3://product-data/catalog-import' });
   * const progress = await index.describeImport(operation.id);
   * console.log(progress.status, progress.recordsImported);
   * ```
   *
   * @see {@link Index.listImports} to find import IDs.
   */
  async describeImport(id: string) {
    return await this._describeImportCommand.run(id);
  }

  /**
   * Request cancellation of an import operation.
   *
   * @param id - The import ID returned by {@link Index.startImport} or {@link Index.listImports}.
   * @returns The cancellation response.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * const page = await index.listImports();
   * const pending = page.data?.find((operation) => operation.status === 'Pending');
   * if (pending) {
   *   await index.cancelImport(pending.id);
   * }
   * ```
   *
   * @see {@link Index.describeImport} to check the operation status.
   */
  async cancelImport(id: string) {
    return await this._cancelImportCommand.run(id);
  }

  /**
   * Create a namespace with an optional metadata schema.
   *
   * Supported for serverless indexes.
   *
   * @param options - A namespace name, such as `products-fr`, and optional metadata fields to make
   * filterable.
   * @returns The namespace description, including its name and record count.
   * @throws {@link Errors.PineconeArgumentError} when the namespace name is empty or missing.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * const namespace = await index.createNamespace({ name: 'products-fr' });
   * console.log(namespace.name);
   * ```
   *
   * @see {@link Index.namespace} to target a namespace with a client.
   */
  async createNamespace(options: CreateNamespaceOptions) {
    return await this._createNamespaceCommand(options);
  }

  /**
   * List one page of namespaces in the index.
   *
   * Supported for serverless indexes.
   *
   * @param options - An optional name prefix, page size, and continuation token; omit for the first
   * unfiltered page.
   * @returns Namespace descriptions in `namespaces` and `pagination.next` when another page is
   * available.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * const page = await index.listNamespaces({ prefix: 'products-' });
   * console.log(page.namespaces);
   * ```
   *
   * @see {@link Index.describeNamespace} for one namespace.
   */
  async listNamespaces(options?: ListNamespacesOptions) {
    return await this._listNamespacesCommand(options);
  }

  /**
   * Get a namespace's name, record count, and schema when available.
   *
   * Supported for serverless indexes.
   *
   * @param namespace - The namespace name, such as `products-en`.
   * @returns The namespace description.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * const details = await index.describeNamespace('products-en');
   * console.log(details.recordCount);
   * ```
   *
   * @see {@link Index.listNamespaces} to discover namespace names.
   */
  async describeNamespace(namespace: string) {
    return await this._describeNamespaceCommand(namespace);
  }

  /**
   * Permanently delete a namespace and all its records.
   *
   * Supported for serverless indexes. This operation is irreversible.
   *
   * @param namespace - The namespace name, such as `retired-products`.
   * @returns Resolves when the deletion request succeeds.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * await index.deleteNamespace('retired-products');
   * ```
   *
   * @see {@link Index.deleteMany} to remove selected records.
   */
  async deleteNamespace(namespace: string) {
    return await this._deleteNamespaceCommand(namespace);
  }

  /**
   * Create a client scoped to a namespace in the same index.
   *
   * Record operations use this namespace unless their options override it. Index-wide operations,
   * such as listing namespaces or describing index statistics, still apply to the whole index.
   *
   * @param namespace - The namespace to target, such as `products-fr`.
   * @returns An {@link Index} preserving this client's metadata type and configuration.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-catalog', namespace: 'products-en' });
   *
   * const frenchProducts = index.namespace('products-fr');
   * const result = await frenchProducts.fetch({ ids: ['trail-shoe-42'] });
   * console.log(result.records);
   * ```
   *
   * @see {@link Index.createNamespace} to create a namespace explicitly.
   */
  namespace(namespace: string): Index<T> {
    return new Index<T>(
      {
        name: this.target.indexName,
        namespace,
        host: this.target.indexHostUrl,
        additionalHeaders: this.additionalHeaders,
      },
      this.config,
    );
  }

  /**
   * Write documents to a schema-based index.
   *
   * @param options - A non-empty `documents` array; each document needs `_id` and fields matching
   * the index schema.
   * @returns The number of documents written in `upsertedCount`.
   * @throws {@link Errors.PineconeArgumentError} when `documents` is empty or missing.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-documents', namespace: 'products-en' });
   *
   * const result = await index.documents.upsert({
   *   documents: [{ _id: 'trail-shoe-42', title: 'Waterproof hiking shoe', category: 'footwear' }],
   * });
   * console.log(result.upsertedCount);
   * ```
   *
   * @see {@link Documents.update} for partial changes; {@link Index.upsertRecords} for integrated
   * embedding records.
   *
   * @deprecated Use {@link Documents.upsert} through `index.documents.upsert()`.
   */
  upsertDocuments(
    options: UpsertDocumentsOptions,
  ): Promise<UpsertDocumentsResponse> {
    return this.documents.upsert(options);
  }

  /**
   * Search schema-based documents using one or more scoring methods.
   *
   * Choose scoring fields and methods supported by your index schema.
   *
   * @param options - Scoring methods in `scoreBy`, the result count `topK`, and optional filters
   * and returned fields.
   * @returns Ranked `matches`, the namespace, and usage information.
   * @throws {@link Errors.PineconeArgumentError} when `scoreBy` is missing or empty, or `topK` is
   * missing or less than 1.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-documents', namespace: 'products-en' });
   *
   * const result = await index.documents.search({
   *   scoreBy: [{ type: 'text', fields: ['title'], query: 'hiking shoes' }],
   *   topK: 5, includeFields: ['title'],
   * });
   * console.log(result.matches);
   * ```
   *
   * @see {@link Index.searchRecords} for integrated embedding search; {@link Index.query} for
   * vector similarity queries.
   *
   * @deprecated Use {@link Documents.search} through `index.documents.search()`.
   */
  searchDocuments(
    options: SearchDocumentsOptions,
  ): Promise<SearchDocumentsResponse> {
    return this.documents.search(options);
  }

  /**
   * Fetch schema-based documents by IDs or a metadata filter.
   *
   * Fetching by filter returns one page at a time.
   *
   * @param options - Either non-empty `ids` or `filter`; use `paginationToken` only with a filter.
   * @returns Documents keyed by ID in `documents`, the namespace, usage, and a continuation token
   * when available.
   * @throws {@link Errors.PineconeArgumentError} when the selection is missing or invalid, or
   * pagination is requested without a filter.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-documents', namespace: 'products-en' });
   *
   * const result = await index.documents.fetch({ ids: ['trail-shoe-42'] });
   * console.log(result.documents['trail-shoe-42']);
   * ```
   *
   * @see {@link Documents.list} to list document IDs; {@link Index.fetch} for vector records.
   *
   * @deprecated Use {@link Documents.fetch} through `index.documents.fetch()`.
   */
  fetchDocuments(
    options: FetchDocumentsOptions,
  ): Promise<FetchDocumentsResponse> {
    return this.documents.fetch(options);
  }

  /**
   * Delete schema-based documents by IDs, filter, or an entire namespace.
   *
   * `deleteAll: true` removes all documents in this client's namespace.
   *
   * @param options - Exactly one of non-empty `ids`, `filter`, or `deleteAll: true`.
   * @returns The number of documents matched by the request in `matchedRecords`.
   * @throws {@link Errors.PineconeArgumentError} when the selection is missing or invalid.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-documents', namespace: 'products-en' });
   *
   * const result = await index.documents.delete({ ids: ['trail-shoe-42'] });
   * console.log(result.matchedRecords);
   * ```
   *
   * @see {@link Index.deleteMany} for vector records.
   *
   * @deprecated Use {@link Documents.delete} through `index.documents.delete()`.
   */
  deleteDocuments(
    options: DeleteDocumentsOptions,
  ): Promise<DeleteDocumentsResponse> {
    return this.documents.delete(options);
  }

  /**
   * List one page of document IDs in the targeted namespace.
   *
   * @param options - An optional ID prefix, page size, and continuation token; defaults to the
   * first unfiltered page.
   * @returns Document entries in `documents`, ordered by ID, and `pagination.next` when another
   * page is available.
   * @throws {@link Errors.PineconeArgumentError} when `limit` is less than 1.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-documents', namespace: 'products-en' });
   *
   * const page = await index.documents.list({ prefix: 'trail-shoe-' });
   * console.log(page.documents);
   * ```
   *
   * @see {@link Documents.fetch} to retrieve document fields; {@link Index.listPaginated} for
   * vector record IDs.
   *
   * @deprecated Use {@link Documents.list} through `index.documents.list()`.
   */
  listDocuments(
    options: ListDocumentsOptions = {},
  ): Promise<ListDocumentsResponse> {
    return this.documents.list(options);
  }

  /**
   * Partially update schema-based documents selected by IDs or a filter.
   *
   * Unspecified fields are preserved. The example changes `category` while retaining the document's
   * title and other fields.
   *
   * @param options - Per-ID changes in `documents`, or a `filter` with non-empty `setFields` and/or
   * `removeFields`.
   * @returns The number of documents matched by the request in `matchedRecords`.
   * @throws {@link Errors.PineconeArgumentError} when the selection or field changes are missing or
   * incompatible.
   *
   * @example
   * ```typescript
   * import { Pinecone } from '@pinecone-database/pinecone';
   * const pc = new Pinecone();
   * const index = pc.index({ name: 'product-documents', namespace: 'products-en' });
   *
   * await index.documents.update({
   *   documents: [{ _id: 'trail-shoe-42', category: 'hiking-footwear' }],
   * });
   * ```
   *
   * @see {@link Documents.upsert} to write documents; {@link Index.update} for vector records.
   *
   * @deprecated Use {@link Documents.update} through `index.documents.update()`.
   */
  updateDocuments(
    options: UpdateDocumentsOptions,
  ): Promise<UpdateDocumentsResponse> {
    return this.documents.update(options);
  }
}
