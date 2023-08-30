import { handleApiError } from '../errors';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';
import { VectorOperationsApi } from '../pinecone-generated-ts-fetch';
import { VectorOperationsProvider } from './vectorOperationsProvider';

export const SparseValuesSchema = Type.Object(
  {
    indices: Type.Array(Type.Integer()),
    values: Type.Array(Type.Number()),
  },
  { additionalProperties: false }
);

const VectorSchema = Type.Object(
  {
    id: Type.String({ minLength: 1 }),
    values: Type.Array(Type.Number()),
    sparseValues: Type.Optional(SparseValuesSchema),
    metadata: Type.Optional(Type.Object({}, { additionalProperties: true })),
  },
  { additionalProperties: false }
);
const VectorArraySchema = Type.Array(VectorSchema);

const ChunkedUpsertSchema = Type.Object({
  vectors: VectorArraySchema,
  chunkSize: Type.Number({ minimum: 1 }),
});

const UpsertOptionsSchema = Type.Union([
  VectorArraySchema,
  ChunkedUpsertSchema,
]);

export type Vector = Static<typeof VectorSchema>;
export type SparseValues = Static<typeof SparseValuesSchema>;
export type VectorArray = Static<typeof VectorArraySchema>;
export type UpsertOptions = Static<typeof UpsertOptionsSchema>;

export const upsert = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  const validator = buildConfigValidator(UpsertOptionsSchema, 'upsert');

  return async (options: UpsertOptions): Promise<void> => {
    validator(options);

    const isChunkedUpsert = !Array.isArray(options);

    try {
      const api = await apiProvider.provide();
      if (isChunkedUpsert) {
        await chunkedUpsert(api, options.vectors, namespace, options.chunkSize);
      } else {
        await api.upsert({ upsertRequest: { vectors: options, namespace } });
      }
      return;
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }
  };
};

const chunkedUpsert = async (
  api: VectorOperationsApi,
  vectors: VectorArray,
  namespace: string,
  chunkSize = 10
) => {
  // Split vectors into chunks and promises for upserting
  const chunks = sliceArrayToChunks(vectors, chunkSize);

  const chunkedPromises = chunks.map(async (chunk) => {
    try {
      await api.upsert({ upsertRequest: { vectors: chunk, namespace } });
    } catch (e) {
      throw new Error(`Error upserting chunk: ${e}`);
    }
  });

  try {
    await Promise.allSettled(chunkedPromises);
    return;
  } catch (e) {
    throw new Error(`Error upserting vectors into index: ${e}`);
  }
};

const sliceArrayToChunks = (array: VectorArray, chunkSize: number) => {
  return Array.from({ length: Math.ceil(array.length / chunkSize) }, (_, i) => {
    return array.slice(i * chunkSize, (i + 1) * chunkSize);
  });
};
