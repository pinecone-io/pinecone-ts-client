import { Type } from '@sinclair/typebox';

export const PineconeConfigurationSchema = Type.Object(
  {
    environment: Type.String({ minLength: 1 }),
    apiKey: Type.String({ minLength: 1 }),
    projectId: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false }
);
export type PineconeConfiguration = {
  environment: string;
  apiKey: string;
  projectId?: string;
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
