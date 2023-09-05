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

const BatchUpsertSchema = Type.Object({
  vectors: VectorArraySchema,
  batchSize: Type.Number({ minimum: 1 }),
});

const UpsertOptionsSchema = Type.Union([VectorArraySchema, BatchUpsertSchema]);

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

    const isBatchUpsert = !Array.isArray(options);

    try {
      const api = await apiProvider.provide();
      if (isBatchUpsert) {
        await batchUpsert(api, options.vectors, namespace, options.batchSize);
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

const batchUpsert = async (
  api: VectorOperationsApi,
  vectors: VectorArray,
  namespace: string,
  batchSize = 10
) => {
  // Split vectors into batches and promises for upserting
  const batches = sliceArrayToBatches(vectors, batchSize);

  const batchPromises = batches.map(async (batch) => {
    try {
      await api.upsert({ upsertRequest: { vectors: batch, namespace } });
    } catch (e) {
      const err = await handleApiError(
        e,
        async (_, rawMessage) => `Error upserting batch: ${rawMessage}`
      );
      throw err;
    }
  });

  try {
    await Promise.allSettled(batchPromises);
    return;
  } catch (e) {
    const err = await handleApiError(
      e,
      async (_, rawMessage) =>
        `Error upserting vectors into index: ${rawMessage}`
    );
    throw err;
  }
};

export const sliceArrayToBatches = (array: VectorArray, batchSize: number) => {
  if (batchSize > 0) {
    return Array.from(
      { length: Math.ceil(array.length / batchSize) },
      (_, i) => {
        return array.slice(i * batchSize, (i + 1) * batchSize);
      }
    );
  }
  // invalid batchSize, return original vectors as a batch
  return [array];
};
