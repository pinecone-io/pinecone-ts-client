/* tslint:disable */
/* eslint-disable */
/**
 * A request for creating a namespace with the specified namespace name.
 * @export
 * @interface CreateNamespaceRequest
 */
export interface CreateNamespaceRequest {
    /**
     * The name of the namespace.
     * @type {string}
     * @memberof CreateNamespaceRequest
     */
    name: string;
    /**
     * 
     * @type {CreateNamespaceRequestSchema}
     * @memberof CreateNamespaceRequest
     */
    schema?: CreateNamespaceRequestSchema;
}
/**
 * Schema for the behavior of Pinecone's internal metadata index. By default, all metadata is indexed; when `schema` is present, only fields which are present in the `fields` object with a `filterable: true` are indexed. Note that `filterable: false` is not currently supported.
 * @export
 * @interface CreateNamespaceRequestSchema
 */
export interface CreateNamespaceRequestSchema {
    /**
     * A map of metadata field names to their configuration. The field name must be a valid metadata field name. The field name must be unique.
     * @type {{ [key: string]: CreateNamespaceRequestSchemaFieldsValue; }}
     * @memberof CreateNamespaceRequestSchema
     */
    fields: { [key: string]: CreateNamespaceRequestSchemaFieldsValue; };
}
/**
 * 
 * @export
 * @interface CreateNamespaceRequestSchemaFieldsValue
 */
export interface CreateNamespaceRequestSchemaFieldsValue {
    /**
     * Whether the field is filterable. If true, the field is indexed and can be used in filters. Only true values are allowed.
     * @type {boolean}
     * @memberof CreateNamespaceRequestSchemaFieldsValue
     */
    filterable?: boolean;
}
/**
 * The request for the `delete_documents` operation. Exactly one of `ids` or `delete_all` must be specified.
 * @export
 * @interface DeleteDocumentsRequest
 */
export interface DeleteDocumentsRequest {
    /**
     * A list of document IDs to delete. Mutually exclusive with `delete_all`.
     * @type {Array<string>}
     * @memberof DeleteDocumentsRequest
     */
    ids?: Array<string>;
    /**
     * If `true`, delete all documents in the namespace. Mutually exclusive with `ids`.
     * @type {boolean}
     * @memberof DeleteDocumentsRequest
     */
    delete_all?: boolean;
}
/**
 * The request for the `delete` operation.
 * @export
 * @interface DeleteRequest
 */
export interface DeleteRequest {
    /**
     * Vectors to delete.
     * @type {Array<string>}
     * @memberof DeleteRequest
     */
    ids?: Array<string>;
    /**
     * This indicates that all vectors in the index namespace should be deleted.
     * @type {boolean}
     * @memberof DeleteRequest
     */
    deleteAll?: boolean;
    /**
     * The namespace to delete records from, if applicable.
     * @type {string}
     * @memberof DeleteRequest
     */
    namespace?: string;
    /**
     * If specified, the metadata filter here will be used to select the vectors to delete. This is mutually exclusive with specifying ids to delete in the ids param or using delete_all=True. See [Delete data](https://docs.pinecone.io/guides/manage-data/delete-data#delete-records-by-metadata).
     * @type {object}
     * @memberof DeleteRequest
     */
    filter?: object;
}
/**
 * The request for the `describe_index_stats` operation.
 * @export
 * @interface DescribeIndexStatsRequest
 */
export interface DescribeIndexStatsRequest {
    /**
     * If this parameter is present, the operation only returns statistics for vectors that satisfy the filter. See [Understanding metadata](https://docs.pinecone.io/guides/index-data/indexing-overview#metadata).
     * 
     * Serverless indexes do not support filtering `describe_index_stats` by metadata.
     * @type {object}
     * @memberof DescribeIndexStatsRequest
     */
    filter?: object;
}
/**
 * Usage information for the `fetch_documents` operation.
 * @export
 * @interface DocumentFetchUsage
 */
export interface DocumentFetchUsage {
    /**
     * The number of read units consumed by this operation.
     * @type {number}
     * @memberof DocumentFetchUsage
     */
    read_units: number;
}
/**
 * A document with a unique identifier and arbitrary field values.
 * @export
 * @interface DocumentRecord
 */
export interface DocumentRecord {
    [key: string]: any | any;
    /**
     * The unique identifier for the document.
     * @type {string}
     * @memberof DocumentRecord
     */
    _id: string;
}
/**
 * A scoring method that defines how documents are scored against a query.
 * 
 * The `type` field determines which other fields are used:
 * - `dense_vector`: Score by dense vector similarity. Requires `field` or `fields`, and a `values` array.
 * - `sparse_vector`: Score by sparse vector similarity. Requires `field` or `fields`, and `sparse_values`.
 * - `text`: Score by BM25 text similarity against a single field. Requires `field` or `fields`, and `query`.
 * - `query_string`: Score using a Lucene query string. Use field qualifiers (`field:(clause)`) to target a field, or omit field qualifiers to search against all text-searchable fields. Errors if `field` or `fields` is provided.
 * @export
 * @interface DocumentScoringMethod
 */
export interface DocumentScoringMethod {
    /**
     * The scoring method type.
     * Possible values: `dense_vector`, `sparse_vector`, `text`, or `query_string`.
     * @type {string}
     * @memberof DocumentScoringMethod
     */
    type: string;
    /**
     * The field to score against.
     * 
     * Required for `dense_vector`, `sparse_vector`, and `text` scoring types. Must not be provided for `query_string`.
     * @type {string}
     * @memberof DocumentScoringMethod
     */
    field?: string;
    /**
     * The text query to use for `text` and `query_string` scoring types.
     * @type {string}
     * @memberof DocumentScoringMethod
     */
    query?: string;
    /**
     * The dense vector values to use for `dense_vector` scoring type.
     * @type {Array<number>}
     * @memberof DocumentScoringMethod
     */
    values?: Array<number>;
    /**
     * 
     * @type {SparseValues}
     * @memberof DocumentScoringMethod
     */
    sparse_values?: SparseValues;
}
/**
 * A document match returned from a search operation, including the document ID, similarity score, and selected fields.
 * @export
 * @interface DocumentSearchMatch
 */
export interface DocumentSearchMatch {
    [key: string]: any | any;
    /**
     * The unique identifier of the matched document.
     * @type {string}
     * @memberof DocumentSearchMatch
     */
    _id: string;
    /**
     * The similarity score of the matched document.
     * @type {number}
     * @memberof DocumentSearchMatch
     */
    _score: number;
}
/**
 * Usage information for the `search_documents` operation.
 * @export
 * @interface DocumentSearchUsage
 */
export interface DocumentSearchUsage {
    /**
     * The number of read units consumed by this operation.
     * @type {number}
     * @memberof DocumentSearchUsage
     */
    read_units: number;
}
/**
 * The request for the `fetch_by_metadata` operation.
 * @export
 * @interface FetchByMetadataRequest
 */
export interface FetchByMetadataRequest {
    /**
     * The namespace to fetch records from.
     * @type {string}
     * @memberof FetchByMetadataRequest
     */
    namespace?: string;
    /**
     * Metadata filter expression to select vectors. See [Understanding metadata](https://docs.pinecone.io/guides/index-data/indexing-overview#metadata).
     * @type {object}
     * @memberof FetchByMetadataRequest
     */
    filter?: object;
    /**
     * Max number of vectors to return.
     * @type {number}
     * @memberof FetchByMetadataRequest
     */
    limit?: number;
    /**
     * Pagination token to continue a previous listing operation.
     * @type {string}
     * @memberof FetchByMetadataRequest
     */
    paginationToken?: string;
}
/**
 * The response for the `fetch_by_metadata` operation.
 * @export
 * @interface FetchByMetadataResponse
 */
export interface FetchByMetadataResponse {
    /**
     * The fetched vectors, in the form of a map between the fetched ids and the fetched vectors
     * @type {{ [key: string]: Vector; }}
     * @memberof FetchByMetadataResponse
     */
    vectors?: { [key: string]: Vector; };
    /**
     * The namespace of the vectors.
     * @type {string}
     * @memberof FetchByMetadataResponse
     */
    namespace?: string;
    /**
     * 
     * @type {Usage}
     * @memberof FetchByMetadataResponse
     */
    usage?: Usage;
    /**
     * 
     * @type {Pagination}
     * @memberof FetchByMetadataResponse
     */
    pagination?: Pagination;
}
/**
 * The request for the `fetch_documents` operation.
 * @export
 * @interface FetchDocumentsRequest
 */
export interface FetchDocumentsRequest {
    /**
     * A list of document IDs to fetch.
     * @type {Array<string>}
     * @memberof FetchDocumentsRequest
     */
    ids: Array<string>;
    /**
     * The document fields to include in the response. If not specified, all fields are returned.
     * @type {Array<string>}
     * @memberof FetchDocumentsRequest
     */
    include_fields?: Array<string>;
}
/**
 * The response for the `fetch_documents` operation.
 * @export
 * @interface FetchDocumentsResponse
 */
export interface FetchDocumentsResponse {
    /**
     * A map of document IDs to their fetched documents.
     * @type {{ [key: string]: FetchedDocumentRecord; }}
     * @memberof FetchDocumentsResponse
     */
    documents: { [key: string]: FetchedDocumentRecord; };
    /**
     * The namespace the documents were fetched from.
     * @type {string}
     * @memberof FetchDocumentsResponse
     */
    namespace: string;
    /**
     * 
     * @type {DocumentFetchUsage}
     * @memberof FetchDocumentsResponse
     */
    usage: DocumentFetchUsage;
}
/**
 * The response for the `fetch` operation.
 * @export
 * @interface FetchResponse
 */
export interface FetchResponse {
    /**
     * 
     * @type {{ [key: string]: Vector; }}
     * @memberof FetchResponse
     */
    vectors?: { [key: string]: Vector; };
    /**
     * The namespace of the vectors.
     * @type {string}
     * @memberof FetchResponse
     */
    namespace?: string;
    /**
     * 
     * @type {Usage}
     * @memberof FetchResponse
     */
    usage?: Usage;
}
/**
 * A fetched document containing its ID and field values.
 * @export
 * @interface FetchedDocumentRecord
 */
export interface FetchedDocumentRecord {
    [key: string]: any | any;
    /**
     * The unique identifier of the document.
     * @type {string}
     * @memberof FetchedDocumentRecord
     */
    _id: string;
}
/**
 * A record whose vector values are similar to the provided search query.
 * @export
 * @interface Hit
 */
export interface Hit {
    /**
     * The record id of the search hit.
     * @type {string}
     * @memberof Hit
     */
    _id: string;
    /**
     * The similarity score of the returned record.
     * @type {number}
     * @memberof Hit
     */
    _score: number;
    /**
     * The selected record fields associated with the search hit.
     * @type {object}
     * @memberof Hit
     */
    fields: object;
}
/**
 * Indicates how to respond to errors during the import process.
 * @export
 * @interface ImportErrorMode
 */
export interface ImportErrorMode {
    /**
     * Indicates how to respond to errors during the import process.
     * Possible values: `abort` or `continue`.
     * @type {string}
     * @memberof ImportErrorMode
     */
    onError?: string;
}
/**
 * The model for an import operation.
 * @export
 * @interface ImportModel
 */
export interface ImportModel {
    /**
     * Unique identifier for the import operation.
     * @type {string}
     * @memberof ImportModel
     */
    id?: string;
    /**
     * The URI from where the data is imported.
     * @type {string}
     * @memberof ImportModel
     */
    uri?: string;
    /**
     * The status of the operation.
     * Possible values: `Pending`, `InProgress`, `Failed`, `Completed`, or `Cancelled`.
     * @type {string}
     * @memberof ImportModel
     */
    status?: string;
    /**
     * The start time of the import operation.
     * @type {string}
     * @memberof ImportModel
     */
    createdAt?: string;
    /**
     * The end time of the import operation.
     * @type {string}
     * @memberof ImportModel
     */
    finishedAt?: string;
    /**
     * The progress made by the operation, as a percentage.
     * @type {number}
     * @memberof ImportModel
     */
    percentComplete?: number;
    /**
     * The number of records successfully imported.
     * @type {number}
     * @memberof ImportModel
     */
    recordsImported?: number;
    /**
     * The error message if the import process failed.
     * @type {string}
     * @memberof ImportModel
     */
    error?: string;
}
/**
 * The response for the `describe_index_stats` operation.
 * @export
 * @interface IndexDescription
 */
export interface IndexDescription {
    /**
     * A mapping for each namespace in the index from the namespace name to a summary of its contents. If a metadata filter expression is present, the summary will reflect only vectors matching that expression.
     * @type {{ [key: string]: NamespaceSummary; }}
     * @memberof IndexDescription
     */
    namespaces?: { [key: string]: NamespaceSummary; };
    /**
     * The dimension of the indexed vectors. Not specified if `sparse` index.
     * @type {number}
     * @memberof IndexDescription
     */
    dimension?: number;
    /**
     * The fullness of the index, regardless of whether a metadata filter expression was passed. The granularity of this metric is 10%.
     * 
     * Serverless indexes scale automatically as needed, so index fullness  is relevant only for pod-based indexes.
     * 
     * The index fullness result may be inaccurate during pod resizing; to get the status of a pod resizing process, use [`describe_index`](https://docs.pinecone.io/reference/api/2024-10/control-plane/describe_index).
     * @type {number}
     * @memberof IndexDescription
     */
    indexFullness?: number;
    /**
     * The total number of vectors in the index, regardless of whether a metadata filter expression was passed
     * @type {number}
     * @memberof IndexDescription
     */
    totalVectorCount?: number;
    /**
     * The metric used to measure similarity.
     * @type {string}
     * @memberof IndexDescription
     */
    metric?: string;
    /**
     * The type of vectors stored in the index.
     * @type {string}
     * @memberof IndexDescription
     */
    vectorType?: string;
    /**
     * The amount of memory used by a dedicated index
     * @type {number}
     * @memberof IndexDescription
     */
    memory_fullness?: number;
    /**
     * The amount of storage used by a dedicated index
     * @type {number}
     * @memberof IndexDescription
     */
    storage_fullness?: number;
}
/**
 * The response for the `list_imports` operation.
 * @export
 * @interface ListImportsResponse
 */
export interface ListImportsResponse {
    /**
     * 
     * @type {Array<ImportModel>}
     * @memberof ListImportsResponse
     */
    data?: Array<ImportModel>;
    /**
     * 
     * @type {Pagination}
     * @memberof ListImportsResponse
     */
    pagination?: Pagination;
}
/**
 * 
 * @export
 * @interface ListItem
 */
export interface ListItem {
    /**
     * 
     * @type {string}
     * @memberof ListItem
     */
    id?: string;
}
/**
 * 
 * @export
 * @interface ListNamespacesResponse
 */
export interface ListNamespacesResponse {
    /**
     * The list of namespaces belonging to this index.
     * @type {Array<NamespaceDescription>}
     * @memberof ListNamespacesResponse
     */
    namespaces?: Array<NamespaceDescription>;
    /**
     * 
     * @type {Pagination}
     * @memberof ListNamespacesResponse
     */
    pagination?: Pagination;
    /**
     * The total number of namespaces in the index matching the prefix
     * @type {number}
     * @memberof ListNamespacesResponse
     */
    total_count?: number;
}
/**
 * The response for the `list` operation.
 * @export
 * @interface ListResponse
 */
export interface ListResponse {
    /**
     * 
     * @type {Array<ListItem>}
     * @memberof ListResponse
     */
    vectors?: Array<ListItem>;
    /**
     * 
     * @type {Pagination}
     * @memberof ListResponse
     */
    pagination?: Pagination;
    /**
     * The namespace of the vectors.
     * @type {string}
     * @memberof ListResponse
     */
    namespace?: string;
    /**
     * 
     * @type {Usage}
     * @memberof ListResponse
     */
    usage?: Usage;
}
/**
 * A description of a namespace, including the name and record count.
 * @export
 * @interface NamespaceDescription
 */
export interface NamespaceDescription {
    /**
     * The name of the namespace.
     * @type {string}
     * @memberof NamespaceDescription
     */
    name?: string;
    /**
     * The total amount of records within the namespace.
     * @type {number}
     * @memberof NamespaceDescription
     */
    record_count?: number;
    /**
     * 
     * @type {CreateNamespaceRequestSchema}
     * @memberof NamespaceDescription
     */
    schema?: CreateNamespaceRequestSchema;
    /**
     * 
     * @type {NamespaceDescriptionIndexedFields}
     * @memberof NamespaceDescription
     */
    indexed_fields?: NamespaceDescriptionIndexedFields;
}
/**
 * A list of all indexed metatadata fields in the namespace
 * @export
 * @interface NamespaceDescriptionIndexedFields
 */
export interface NamespaceDescriptionIndexedFields {
    /**
     * 
     * @type {Array<string>}
     * @memberof NamespaceDescriptionIndexedFields
     */
    fields?: Array<string>;
}
/**
 * A summary of the contents of a namespace.
 * @export
 * @interface NamespaceSummary
 */
export interface NamespaceSummary {
    /**
     * The number of vectors stored in this namespace. Note that updates to this field may lag behind updates to the underlying index and corresponding query results, etc.
     * @type {number}
     * @memberof NamespaceSummary
     */
    vectorCount?: number;
}
/**
 * 
 * @export
 * @interface Pagination
 */
export interface Pagination {
    /**
     * 
     * @type {string}
     * @memberof Pagination
     */
    next?: string;
}
/**
 * 
 * @export
 * @interface ProtobufAny
 */
export interface ProtobufAny {
    /**
     * 
     * @type {string}
     * @memberof ProtobufAny
     */
    typeUrl?: string;
    /**
     * 
     * @type {string}
     * @memberof ProtobufAny
     */
    value?: string;
}
/**
 * The request for the `query` operation.
 * @export
 * @interface QueryRequest
 */
export interface QueryRequest {
    /**
     * The namespace to query.
     * @type {string}
     * @memberof QueryRequest
     */
    namespace?: string;
    /**
     * The number of results to return for each query.
     * @type {number}
     * @memberof QueryRequest
     */
    topK: number;
    /**
     * The filter to apply. You can use vector metadata to limit your search. See [Understanding metadata](https://docs.pinecone.io/guides/index-data/indexing-overview#metadata).
     * @type {object}
     * @memberof QueryRequest
     */
    filter?: object;
    /**
     * Indicates whether vector values are included in the response. For on-demand indexes, setting this to `true` may increase latency, especially with higher `topK` values, because vector values are retrieved from object storage. Unless you need vector values, set this to `false` for better performance.
     * @type {boolean}
     * @memberof QueryRequest
     */
    includeValues?: boolean;
    /**
     * Indicates whether metadata is included in the response as well as the ids.
     * @type {boolean}
     * @memberof QueryRequest
     */
    includeMetadata?: boolean;
    /**
     * DEPRECATED. Use `vector` or `id` instead.
     * @type {Array<QueryVector>}
     * @memberof QueryRequest
     * @deprecated
     */
    queries?: Array<QueryVector>;
    /**
     * The query vector. This should be the same length as the dimension of the index being queried. Each `query` request can contain only one of the parameters `id` or `vector`.
     * @type {Array<number>}
     * @memberof QueryRequest
     */
    vector?: Array<number>;
    /**
     * 
     * @type {SparseValues}
     * @memberof QueryRequest
     */
    sparseVector?: SparseValues;
    /**
     * The unique ID of the vector to be used as a query vector. Each request can contain either the `vector` or `id` parameter.
     * @type {string}
     * @memberof QueryRequest
     */
    id?: string;
    /**
     * An optimization parameter for IVF dense indexes in dedicated read node indexes. It adjusts how much of the index is scanned to find vector candidates. Range: 0.5 – 4 (default).
     * Keep the default (4.0) for the best search results. If query latency is too high, try lowering this value incrementally (minimum 0.5) to speed up the search at the cost of slightly lower accuracy. This parameter is only supported for dedicated (DRN) dense indexes.
     * @type {number}
     * @memberof QueryRequest
     */
    scanFactor?: number;
    /**
     * An optimization parameter that controls the maximum number of candidate dense vectors to rerank. Reranking computes exact distances to improve recall but increases query latency. Range: top_k – 100000.
     * Keep the default for a balance of recall and latency. Increase this value if recall is too low, or decrease it to reduce latency at the cost of accuracy. This parameter is only supported for dedicated (DRN) dense indexes.
     * @type {number}
     * @memberof QueryRequest
     */
    maxCandidates?: number;
}
/**
 * The response for the `query` operation. These are the matches found for a particular query vector. The matches are ordered from most similar to least similar.
 * @export
 * @interface QueryResponse
 */
export interface QueryResponse {
    /**
     * DEPRECATED. The results of each query. The order is the same as `QueryRequest.queries`.
     * @type {Array<SingleQueryResults>}
     * @memberof QueryResponse
     * @deprecated
     */
    results?: Array<SingleQueryResults>;
    /**
     * The matches for the vectors.
     * @type {Array<ScoredVector>}
     * @memberof QueryResponse
     */
    matches?: Array<ScoredVector>;
    /**
     * The namespace for the vectors.
     * @type {string}
     * @memberof QueryResponse
     */
    namespace?: string;
    /**
     * 
     * @type {Usage}
     * @memberof QueryResponse
     */
    usage?: Usage;
}
/**
 * A single query vector within a `QueryRequest`.
 * @export
 * @interface QueryVector
 */
export interface QueryVector {
    /**
     * The query vector values. This should be the same length as the dimension of the index being queried.
     * @type {Array<number>}
     * @memberof QueryVector
     */
    values: Array<number>;
    /**
     * 
     * @type {SparseValues}
     * @memberof QueryVector
     */
    sparseValues?: SparseValues;
    /**
     * An override for the number of results to return for this query vector.
     * @type {number}
     * @memberof QueryVector
     */
    topK?: number;
    /**
     * An override the namespace to search.
     * @type {string}
     * @memberof QueryVector
     */
    namespace?: string;
    /**
     * An override for the metadata filter to apply. This replaces the request-level filter.
     * @type {object}
     * @memberof QueryVector
     */
    filter?: object;
}
/**
 * 
 * @export
 * @interface RpcStatus
 */
export interface RpcStatus {
    /**
     * 
     * @type {number}
     * @memberof RpcStatus
     */
    code?: number;
    /**
     * 
     * @type {string}
     * @memberof RpcStatus
     */
    message?: string;
    /**
     * 
     * @type {Array<ProtobufAny>}
     * @memberof RpcStatus
     */
    details?: Array<ProtobufAny>;
}
/**
 * 
 * @export
 * @interface ScoredVector
 */
export interface ScoredVector {
    /**
     * This is the vector's unique id.
     * @type {string}
     * @memberof ScoredVector
     */
    id: string;
    /**
     * This is a measure of similarity between this vector and the query vector.  The higher the score, the more they are similar.
     * @type {number}
     * @memberof ScoredVector
     */
    score?: number;
    /**
     * This is the vector data, if it is requested.
     * @type {Array<number>}
     * @memberof ScoredVector
     */
    values?: Array<number>;
    /**
     * 
     * @type {SparseValues}
     * @memberof ScoredVector
     */
    sparseValues?: SparseValues;
    /**
     * This is the metadata, if it is requested.
     * @type {object}
     * @memberof ScoredVector
     */
    metadata?: object;
}
/**
 * The request for the `search_documents` operation.
 * @export
 * @interface SearchDocumentsRequest
 */
export interface SearchDocumentsRequest {
    /**
     * The list of scoring methods to use for ranking documents.
     * @type {Array<DocumentScoringMethod>}
     * @memberof SearchDocumentsRequest
     */
    score_by: Array<DocumentScoringMethod>;
    /**
     * The number of top-ranked documents to return.
     * @type {number}
     * @memberof SearchDocumentsRequest
     */
    top_k: number;
    /**
     * The document fields to include in the search results.
     * @type {Array<string>}
     * @memberof SearchDocumentsRequest
     */
    include_fields?: Array<string>;
    /**
     * A metadata filter expression to restrict the documents searched.
     * @type {object}
     * @memberof SearchDocumentsRequest
     */
    filter?: object;
}
/**
 * The response for the `search_documents` operation.
 * @export
 * @interface SearchDocumentsResponse
 */
export interface SearchDocumentsResponse {
    /**
     * The matching documents, ordered from most to least similar.
     * @type {Array<DocumentSearchMatch>}
     * @memberof SearchDocumentsResponse
     */
    matches: Array<DocumentSearchMatch>;
    /**
     * The namespace that was searched.
     * @type {string}
     * @memberof SearchDocumentsResponse
     */
    namespace: string;
    /**
     * 
     * @type {DocumentSearchUsage}
     * @memberof SearchDocumentsResponse
     */
    usage: DocumentSearchUsage;
}
/**
 * Specifies which terms must be present in the text of each search hit based on the specified strategy. The match is performed
 * against the text field specified in the integrated index `field_map` configuration.
 * 
 * Terms are normalized and tokenized into single tokens before matching, and order does not matter.
 * 
 * Example:
 * 
 *   `"match_terms": {"terms": ["animal", "CHARACTER", "donald Duck"], "strategy": "all"}` will tokenize
 *   to `["animal", "character", "donald", "duck"]`, and would match
 *   `"Donald F. Duck is a funny animal character"` but would not match `"A duck is a funny animal"`.
 * 
 * Match terms filtering is supported only for sparse indexes with [integrated embedding](https://docs.pinecone.io/guides/index-data/indexing-overview#vector-embedding)
 * configured to use the [pinecone-sparse-english-v0](https://docs.pinecone.io/models/pinecone-sparse-english-v0) model.
 * @export
 * @interface SearchMatchTerms
 */
export interface SearchMatchTerms {
    /**
     * The strategy for matching terms in the text. Currently, only `all` is supported, which means all specified terms must be present.
     * @type {string}
     * @memberof SearchMatchTerms
     */
    strategy?: string;
    /**
     * A list of terms that must be present in the text of each search hit based on the specified strategy.
     * @type {Array<string>}
     * @memberof SearchMatchTerms
     */
    terms?: Array<string>;
}
/**
 * A search request for records in a specific namespace.
 * @export
 * @interface SearchRecordsRequest
 */
export interface SearchRecordsRequest {
    /**
     * 
     * @type {SearchRecordsRequestQuery}
     * @memberof SearchRecordsRequest
     */
    query: SearchRecordsRequestQuery;
    /**
     * The fields to return in the search results. If not specified, the response will include all fields.
     * @type {Array<string>}
     * @memberof SearchRecordsRequest
     */
    fields?: Array<string>;
    /**
     * 
     * @type {SearchRecordsRequestRerank}
     * @memberof SearchRecordsRequest
     */
    rerank?: SearchRecordsRequestRerank;
}
/**
 * .
 * @export
 * @interface SearchRecordsRequestQuery
 */
export interface SearchRecordsRequestQuery {
    /**
     * The number of similar records to return.
     * @type {number}
     * @memberof SearchRecordsRequestQuery
     */
    top_k: number;
    /**
     * The filter to apply. You can use vector metadata to limit your search. See [Understanding metadata](https://docs.pinecone.io/guides/index-data/indexing-overview#metadata).
     * @type {object}
     * @memberof SearchRecordsRequestQuery
     */
    filter?: object;
    /**
     * 
     * @type {object}
     * @memberof SearchRecordsRequestQuery
     */
    inputs?: object;
    /**
     * 
     * @type {SearchRecordsVector}
     * @memberof SearchRecordsRequestQuery
     */
    vector?: SearchRecordsVector;
    /**
     * The unique ID of the vector to be used as a query vector.
     * @type {string}
     * @memberof SearchRecordsRequestQuery
     */
    id?: string;
    /**
     * 
     * @type {SearchMatchTerms}
     * @memberof SearchRecordsRequestQuery
     */
    match_terms?: SearchMatchTerms;
}
/**
 * Parameters for reranking the initial search results.
 * @export
 * @interface SearchRecordsRequestRerank
 */
export interface SearchRecordsRequestRerank {
    /**
     * The name of the [reranking model](https://docs.pinecone.io/guides/search/rerank-results#reranking-models) to use.
     * @type {string}
     * @memberof SearchRecordsRequestRerank
     */
    model: string;
    /**
     * The field(s) to consider for reranking. If not provided, the default is `["text"]`.
     * 
     * The number of fields supported is [model-specific](https://docs.pinecone.io/guides/search/rerank-results#reranking-models).
     * @type {Array<string>}
     * @memberof SearchRecordsRequestRerank
     */
    rank_fields: Array<string>;
    /**
     * The number of top results to return after reranking. Defaults to top_k.
     * @type {number}
     * @memberof SearchRecordsRequestRerank
     */
    top_n?: number;
    /**
     * Additional model-specific parameters. Refer to the [model guide](https://docs.pinecone.io/guides/search/rerank-results#reranking-models) for available model parameters.
     * @type {{ [key: string]: any; }}
     * @memberof SearchRecordsRequestRerank
     */
    parameters?: { [key: string]: any; };
    /**
     * The query to rerank documents against. If a specific rerank query is specified,  it overwrites the query input that was provided at the top level.
     * @type {string}
     * @memberof SearchRecordsRequestRerank
     */
    query?: string;
}
/**
 * The records search response.
 * @export
 * @interface SearchRecordsResponse
 */
export interface SearchRecordsResponse {
    /**
     * 
     * @type {SearchRecordsResponseResult}
     * @memberof SearchRecordsResponse
     */
    result: SearchRecordsResponseResult;
    /**
     * 
     * @type {SearchUsage}
     * @memberof SearchRecordsResponse
     */
    usage: SearchUsage;
}
/**
 * 
 * @export
 * @interface SearchRecordsResponseResult
 */
export interface SearchRecordsResponseResult {
    /**
     * The hits for the search document request.
     * @type {Array<Hit>}
     * @memberof SearchRecordsResponseResult
     */
    hits: Array<Hit>;
}
/**
 * 
 * @export
 * @interface SearchRecordsVector
 */
export interface SearchRecordsVector {
    /**
     * This is the vector data included in the request.
     * @type {Array<number>}
     * @memberof SearchRecordsVector
     */
    values?: Array<number>;
    /**
     * The sparse embedding values.
     * @type {Array<number>}
     * @memberof SearchRecordsVector
     */
    sparse_values?: Array<number>;
    /**
     * The sparse embedding indices.
     * @type {Array<number>}
     * @memberof SearchRecordsVector
     */
    sparse_indices?: Array<number>;
}
/**
 * 
 * @export
 * @interface SearchUsage
 */
export interface SearchUsage {
    /**
     * The number of read units consumed by this operation.
     * @type {number}
     * @memberof SearchUsage
     */
    read_units: number;
    /**
     * The number of embedding tokens consumed by this operation.
     * @type {number}
     * @memberof SearchUsage
     */
    embed_total_tokens?: number;
    /**
     * The number of rerank units consumed by this operation.
     * @type {number}
     * @memberof SearchUsage
     */
    rerank_units?: number;
}
/**
 * 
 * @export
 * @interface SingleQueryResults
 */
export interface SingleQueryResults {
    /**
     * The matches for the vectors.
     * @type {Array<ScoredVector>}
     * @memberof SingleQueryResults
     */
    matches?: Array<ScoredVector>;
    /**
     * The namespace for the vectors.
     * @type {string}
     * @memberof SingleQueryResults
     */
    namespace?: string;
}
/**
 * Vector sparse data. Represented as a list of indices and a list of  corresponded values, which must be with the same length.
 * @export
 * @interface SparseValues
 */
export interface SparseValues {
    /**
     * The indices of the sparse data.
     * @type {Array<number>}
     * @memberof SparseValues
     */
    indices: Array<number>;
    /**
     * The corresponding values of the sparse data, which must be with the same length as the indices.
     * @type {Array<number>}
     * @memberof SparseValues
     */
    values: Array<number>;
}
/**
 * The request for the `start_import` operation.
 * @export
 * @interface StartImportRequest
 */
export interface StartImportRequest {
    /**
     * The id of the [storage integration](https://docs.pinecone.io/guides/operations/integrations/manage-storage-integrations) that should be used to access the data.
     * @type {string}
     * @memberof StartImportRequest
     */
    integrationId?: string;
    /**
     * The URI of the bucket (or container) and import directory containing the namespaces and Parquet files you want to import. For example, `s3://BUCKET_NAME/IMPORT_DIR` for Amazon S3, `gs://BUCKET_NAME/IMPORT_DIR` for Google Cloud Storage, or `https://STORAGE_ACCOUNT.blob.core.windows.net/CONTAINER_NAME/IMPORT_DIR` for Azure Blob Storage. For more information, see [Import records](https://docs.pinecone.io/guides/index-data/import-data#prepare-your-data).
     * @type {string}
     * @memberof StartImportRequest
     */
    uri: string;
    /**
     * 
     * @type {ImportErrorMode}
     * @memberof StartImportRequest
     */
    errorMode?: ImportErrorMode;
}
/**
 * The response for the `start_import` operation.
 * @export
 * @interface StartImportResponse
 */
export interface StartImportResponse {
    /**
     * Unique identifier for the import operation.
     * @type {string}
     * @memberof StartImportResponse
     */
    id?: string;
}
/**
 * The request for the `update` operation.
 * @export
 * @interface UpdateRequest
 */
export interface UpdateRequest {
    /**
     * Vector's unique id.
     * @type {string}
     * @memberof UpdateRequest
     */
    id?: string;
    /**
     * Vector data.
     * @type {Array<number>}
     * @memberof UpdateRequest
     */
    values?: Array<number>;
    /**
     * 
     * @type {SparseValues}
     * @memberof UpdateRequest
     */
    sparseValues?: SparseValues;
    /**
     * Metadata to set for the record.
     * @type {object}
     * @memberof UpdateRequest
     */
    setMetadata?: object;
    /**
     * The namespace containing the record to update.
     * @type {string}
     * @memberof UpdateRequest
     */
    namespace?: string;
    /**
     * A metadata filter expression. When updating metadata across records in a namespace,  the update is applied to all records that match the filter.  See [Understanding metadata](https://docs.pinecone.io/guides/index-data/indexing-overview#metadata).
     * @type {object}
     * @memberof UpdateRequest
     */
    filter?: object;
    /**
     * If `true`, return the number of records that match the `filter`, but do not execute the update.  Default is `false`.
     * @type {boolean}
     * @memberof UpdateRequest
     */
    dryRun?: boolean;
}
/**
 * The response for the `update` operation.
 * @export
 * @interface UpdateResponse
 */
export interface UpdateResponse {
    /**
     * The number of records that matched the filter (if a filter was provided).
     * @type {number}
     * @memberof UpdateResponse
     */
    matchedRecords?: number;
}
/**
 * The request for the `upsert_documents` operation.
 * @export
 * @interface UpsertDocumentsRequest
 */
export interface UpsertDocumentsRequest {
    /**
     * The list of documents to upsert into the namespace.
     * @type {Array<DocumentRecord>}
     * @memberof UpsertDocumentsRequest
     */
    documents: Array<DocumentRecord>;
}
/**
 * The response for the `upsert_documents` operation.
 * @export
 * @interface UpsertDocumentsResponse
 */
export interface UpsertDocumentsResponse {
    /**
     * The number of documents successfully upserted.
     * @type {number}
     * @memberof UpsertDocumentsResponse
     */
    upserted_count: number;
}
/**
 * The request for the `upsert` operation.
 * @export
 * @interface UpsertRecord
 */
export interface UpsertRecord {
    /**
     * The unique ID of the record to upsert. Note that `id` can be used as an alias for `_id`.
     * @type {string}
     * @memberof UpsertRecord
     */
    _id: string;
}
/**
 * The request for the `upsert` operation.
 * @export
 * @interface UpsertRequest
 */
export interface UpsertRequest {
    /**
     * An array containing the vectors to upsert. Recommended batch limit is up to 1000 vectors.
     * @type {Array<Vector>}
     * @memberof UpsertRequest
     */
    vectors: Array<Vector>;
    /**
     * The namespace where you upsert records.
     * @type {string}
     * @memberof UpsertRequest
     */
    namespace?: string;
}
/**
 * The response for the `upsert` operation.
 * @export
 * @interface UpsertResponse
 */
export interface UpsertResponse {
    /**
     * The number of vectors upserted.
     * @type {number}
     * @memberof UpsertResponse
     */
    upsertedCount?: number;
}
/**
 * 
 * @export
 * @interface Usage
 */
export interface Usage {
    /**
     * The number of read units consumed by this operation.
     * @type {number}
     * @memberof Usage
     */
    readUnits?: number;
}
/**
 * 
 * @export
 * @interface Vector
 */
export interface Vector {
    /**
     * This is the vector's unique id.
     * @type {string}
     * @memberof Vector
     */
    id: string;
    /**
     * This is the vector data included in the request.
     * @type {Array<number>}
     * @memberof Vector
     */
    values?: Array<number>;
    /**
     * 
     * @type {SparseValues}
     * @memberof Vector
     */
    sparseValues?: SparseValues;
    /**
     * This is the metadata included in the request.
     * @type {object}
     * @memberof Vector
     */
    metadata?: object;
}
