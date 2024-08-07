import { Type } from '@sinclair/typebox';
import type {
  HTTPHeaders,
} from '../pinecone-generated-ts-fetch/data';
import { fetch as undiciFetch } from 'undici';
import {FetchAPI2} from "../utils/fetch";

export type CustomFetch = WindowOrWorkerGlobalScope['fetch'] | typeof undiciFetch;
export type FetchAPI = CustomFetch;

export const PineconeConfigurationSchema = Type.Object(
  {
    apiKey: Type.String({ minLength: 1 }),
    controllerHostUrl: Type.Optional(Type.String({ minLength: 1 })),

    // fetchApi is a complex type that I don't really want to recreate in the
    // form of a json schema (seems difficult and error prone). So we will
    // rely on TypeScript to guide people in the right direction here.
    // But declaring it here as Type.Any() is needed to avoid getting caught
    // in the additionalProperties check.
    fetchApi: Type.Optional(Type.Any()),

    additionalHeaders: Type.Optional(Type.Any()),
    sourceTag: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false }
);

/**
 * @see [Understanding projects](https://docs.pinecone.io/docs/projects)
 */
export type PineconeConfiguration = {
  /**
   * The API key for your Pinecone project. You can find this in the [Pinecone console](https://app.pinecone.io).
   */
  apiKey: string;

  /**
   * Optional configuration field for specifying the controller host. If not specified, the client will use the default controller host: https://api.pinecone.io.
   */
  controllerHostUrl?: string;

  /**
   * Optional configuration field for specifying the fetch implementation. If not specified, the client will look for fetch in the global scope and if none is found it will fall back to a [cross-fetch](https://www.npmjs.com/package/cross-fetch) polyfill.
   */
  // fetchApi?: FetchAPI;
  fetchApi?: FetchAPI2;

  /**
   * Optional headers to be included in all requests.
   */
  additionalHeaders?: HTTPHeaders;

  /**
   * Optional sourceTag that is applied to the User-Agent header with all requests.
   */
  sourceTag?: string;
};

export const RecordIdSchema = Type.String({ minLength: 1 });
export const RecordValuesSchema = Type.Array(Type.Number());
export const RecordSparseValuesSchema = Type.Object(
  {
    indices: Type.Array(Type.Integer()),
    values: Type.Array(Type.Number()),
  },
  { additionalProperties: false }
);
export const PineconeRecordSchema = Type.Object(
  {
    id: RecordIdSchema,
    values: RecordValuesSchema,
    sparseValues: Type.Optional(RecordSparseValuesSchema),
    metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
  },
  { additionalProperties: false }
);

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
 * @see [Filtering with metadata](https://docs.pinecone.io/docs/metadata-filtering#supported-metadata-types)
 */
export type RecordMetadataValue = string | boolean | number | Array<string>;

/**
 * @see [Filtering with metadata](https://docs.pinecone.io/docs/metadata-filtering#supported-metadata-types)
 */
export type RecordMetadata = Record<string, RecordMetadataValue>;

/**
 * @see [Pinecone records](https://docs.pinecone.io/docs/overview#pinecone-indexes-store-records-with-vector-data)
 */
export type PineconeRecord<T extends RecordMetadata = RecordMetadata> = {
  /**
   * The id of the record. This string can be any value and is
   * useful when fetching or deleting by id.
   */
  id: RecordId;

  /**
   * An array of numbers representing an embedding vector.
   */
  values: RecordValues;

  /**
   * Records can optionally include sparse and dense values when an index
   * is used for hybrid search. See [Sparse-dense vectors](https://docs.pinecone.io/docs/sparse-dense-vectors)
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
