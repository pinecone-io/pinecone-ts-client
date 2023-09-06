import { Static, Type } from '@sinclair/typebox';

export const PineconeConfigurationSchema = Type.Object(
  {
    environment: Type.String({ minLength: 1 }),
    apiKey: Type.String({ minLength: 1 }),
    projectId: Type.Optional(Type.String({ minLength: 1 })),
  },
  { additionalProperties: false }
);
export type PineconeConfiguration = Static<typeof PineconeConfigurationSchema>;

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

export type RecordId = Static<typeof RecordIdSchema>;
export type Values = Static<typeof RecordValuesSchema>;
export type SparseValues = Static<typeof RecordSparseValuesSchema>;
export type PineconeRecord = Static<typeof PineconeRecordSchema>;
