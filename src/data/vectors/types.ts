import type {
  FetchAPI,
  HTTPHeaders,
} from '../../pinecone-generated-ts-fetch/db_data';

/**
 * Configuration passed to {@link Pinecone} when creating a client.
 *
 * @see [Understanding projects](https://docs.pinecone.io/docs/projects)
 */
export type PineconeConfiguration = {
  /**
   * The API key for your Pinecone project. You can find this in the [Pinecone
   * console](https://app.pinecone.io).
   */
  apiKey: string;

  /**
   * Override the API host for index management. Defaults to `https://api.pinecone.io`.
   */
  controllerHostUrl?: string;

  /**
   * Custom fetch implementation; omit to use the global `fetch`.
   */
  fetchApi?: FetchAPI;

  /**
   * Optional headers to be included in all requests.
   */
  additionalHeaders?: HTTPHeaders;

  /**
   * Optional sourceTag that is applied to the User-Agent header with all requests.
   */
  sourceTag?: string;

  /**
   * Caller identification included in the User-Agent header, for example an AI coding assistant.
   * Set `model` to the caller's model name and optionally identify its provider.
   */
  caller?: {
    /**
     * Optional provider identifier (e.g., 'google', 'anthropic', 'openai').
     */
    provider?: string;
    /**
     * The model name reported by the caller.
     */
    model: string;
  };

  /**
   * Maximum retries after the initial request. Defaults to 3; set to 0 to disable retries.
   */
  maxRetries?: number;

  /**
   * Optional configuration field for specifying a region to use with the assistant APIs. If not
   * specified, the default
   * region of "us" is used.
   */
  assistantRegion?: string;
};

/** The id of the record */
export type RecordId = string;

/** An array of values, usually an embedding vector. */
export type RecordValues = Array<number>;

/**
 * A sparse representation of vector values
 *
 * @see [Understanding hybrid search](https://docs.pinecone.io/docs/hybrid-search)
 */
export type RecordSparseValues = {
  /** A list of indices where non-zero values are present in a vector. */
  indices: Array<number>;

  /** The values that correspond to the positions in the `indices` array. */
  values: Array<number>;
};

/**
 * A flexible type describing valid values for metadata stored with
 * each record.
 *
 * @see [Filtering with
 * metadata](https://docs.pinecone.io/docs/metadata-filtering#supported-metadata-types)
 */
export type RecordMetadataValue = string | boolean | number | Array<string>;

/**
 * Metadata fields used to filter and describe vector records.
 *
 * @see [Filtering with
 * metadata](https://docs.pinecone.io/docs/metadata-filtering#supported-metadata-types)
 */
export type RecordMetadata = Record<string, RecordMetadataValue>;

/**
 * A vector record with an ID, dense or sparse values, and optional metadata.
 * Supply values when upserting; query responses omit them unless requested.
 *
 * @see [Pinecone
 * records](https://docs.pinecone.io/docs/overview#pinecone-indexes-store-records-with-vector-data)
 */
export type PineconeRecord<T extends RecordMetadata = RecordMetadata> = {
  /**
   * The record ID, such as `trail-shoe-42`, used to fetch, update, or delete the record.
   */
  id: RecordId;

  /**
   * An array of numbers representing an embedding vector.
   */
  values?: RecordValues;

  /**
   * Records can optionally include sparse and dense values when an index
   * is used for hybrid search. See [Sparse-dense
   * vectors](https://docs.pinecone.io/docs/sparse-dense-vectors)
   */
  sparseValues?: RecordSparseValues;

  /**
   * Any metadata associated with this record.
   */
  metadata?: T;
};

/**
 * Metadata detailing usage units for a specific operation.
 */
export type OperationUsage = {
  /**
   * The number of read units consumed by this operation.
   */
  readUnits?: number;
};

/**
 * Integrated records require an `id` or `_id` field in addition to any relevant model fields, or
 * metadata.
 */
export type IntegratedRecord<T extends RecordMetadata = RecordMetadata> = {
  /** Unique record identifier; supply either id or _id. */
  id?: string;
  /** Alternate spelling of the unique record identifier. */
  _id?: string;
} & T;
