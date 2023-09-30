import { Type } from '@sinclair/typebox';
import type { FetchAPI } from '../pinecone-generated-ts-fetch';

export const PineconeConfigurationSchema = Type.Object(
  {
    environment: Type.String({ minLength: 1 }),
    apiKey: Type.String({ minLength: 1 }),
    projectId: Type.Optional(Type.String({ minLength: 1 })),

    // fetchApi is a complex type that I don't really want to recreate in the
    // form of a json schema (seems difficult and error prone). So we will
    // rely on TypeScript to guide people in the right direction here.
    // But declaring it here as Type.Any() is needed to avoid getting caught
    // in the additionalProperties check.
    fetchApi: Type.Optional(Type.Any()),
  },
  { additionalProperties: false }
);

/**
 * @see [Understanding projects](https://docs.pinecone.io/docs/projects)
 */
export type PineconeConfiguration = {
  /**
   * The environment for your Pinecone project. You can find this in the [Pinecone console](https://app.pinecone.io).
   */
  environment: string;

  /**
   * The API key for your Pinecone project. You can find this in the [Pinecone console](https://app.pinecone.io).
   */
  apiKey: string;

  /** The project ID for your Pinecone project. This optional field can be passed, but if it is not then it will be automatically fetched when needed. */
  projectId?: string;

  /**
   * Optional configuration field for specifying the fetch implementation. If not specified, the client will look for fetch in the global scope and if none is found it will fall back to a [cross-fetch](https://www.npmjs.com/package/cross-fetch) polyfill.
   */
  fetchApi?: FetchAPI;
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

export type RecordId = string;
export type RecordValues = Array<number>;
export type RecordSparseValues = {
  indices: Array<number>;
  values: Array<number>;
};
export type RecordMetadataValue = string | boolean | number | Array<string>;
export type RecordMetadata = Record<string, RecordMetadataValue>;
export type PineconeRecord<T extends RecordMetadata = RecordMetadata> = {
  id: RecordId;
  values: RecordValues;
  sparseValues?: RecordSparseValues;
  metadata?: T;
};
