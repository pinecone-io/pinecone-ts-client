import { handleApiError, PineconeBatchUpsertError } from '../errors';
import { buildConfigValidator } from '../validator';
import { Static, Type } from '@sinclair/typebox';
import { VectorOperationsApi } from '../pinecone-generated-ts-fetch';
import { VectorOperationsProvider } from './vectorOperationsProvider';
import { PineconeRecord, PineconeRecordSchema } from './types';

const RecordArraySchema = Type.Array(PineconeRecordSchema);
const BatchUpsertSchema = Type.Object({
  records: RecordArraySchema,
  batchSize: Type.Number({ minimum: 1 }),
});

const UpsertOptionsSchema = Type.Union([RecordArraySchema, BatchUpsertSchema]);
export type UpsertOptions = Static<typeof UpsertOptionsSchema>;

export const upsert = (
  apiProvider: VectorOperationsProvider,
  namespace: string
) => {
  const validator = buildConfigValidator(UpsertOptionsSchema, 'upsert');

  return async (options: UpsertOptions): Promise<void> => {
    validator(options);

    const isBatchUpsert = !Array.isArray(options);

    let api;
    try {
      api = await apiProvider.provide();
    } catch (e) {
      const err = await handleApiError(e);
      throw err;
    }

    if (isBatchUpsert) {
      // We do not try/catch batchUpsert with handleApiError here because
      // that has already taken place inside of the batched request promises.
      // The error that is thrown from batchUpsert has already handled wrapping
      // the request error and attempting to do the same here will result in
      // a TypeError.
      await batchUpsert(api, options.records, namespace, options.batchSize);
    } else {
      try {
        await api.upsert({ upsertRequest: { vectors: options, namespace } });
      } catch (e) {
        const err = await handleApiError(e);
        throw err;
      }
    }
    return;
  };
};

const batchUpsert = async (
  api: VectorOperationsApi,
  records: Array<PineconeRecord>,
  namespace: string,
  batchSize = 10
) => {
  // Split vectors into batches and promises for upserting
  const batches = sliceArrayToBatches(records, batchSize);

  const batchPromises = batches.map(async (batch, batchNumber) => {
    try {
      await api.upsert({ upsertRequest: { vectors: batch, namespace } });
    } catch (e) {
      const err = await handleApiError(
        e,
        async (_, rawMessage) =>
          `Error upserting batch ${batchNumber}: ${rawMessage}`
      );
      throw err;
    }
  });

  const resolved = await Promise.allSettled(batchPromises);
  const failureMessages = resolved
    .filter((p) => p.status === 'rejected')
    .map((p) => {
      // We can safely case because of the above filter.
      const failure = p as PromiseRejectedResult;
      return failure.reason;
    });
  if (failureMessages.length > 0) {
    const failureCount = failureMessages.length;
    const successCount = resolved.length - failureCount;
    throw new PineconeBatchUpsertError(
      successCount,
      failureCount,
      failureMessages
    );
  }
  return;
};

export const sliceArrayToBatches = (
  array: Array<PineconeRecord>,
  batchSize: number
) => {
  if (batchSize > 0) {
    return Array.from(
      { length: Math.ceil(array.length / batchSize) },
      (_, i) => {
        return array.slice(i * batchSize, (i + 1) * batchSize);
      }
    );
  }
  // invalid batchSize, return original records as a batch
  return [array];
};
