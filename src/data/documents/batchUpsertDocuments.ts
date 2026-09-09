import type {
  DocumentOperationsApi,
  DocumentRecord,
} from '../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../errors';
import {
  PineconeBatchUpsertError,
  PineconeBatchUpsertUnsentError,
} from '../../errors/batch';
import { upsertDocuments } from './upsertDocuments';

/** Documents sent per request when `batchSize` is omitted. */
export const DEFAULT_BATCH_UPSERT_BATCH_SIZE = 50;

/** Requests in flight at once when `maxConcurrency` is omitted. */
export const DEFAULT_BATCH_UPSERT_MAX_CONCURRENCY = 8;

const MAX_BATCH_SIZE = 1000;
const MAX_CONCURRENCY = 64;

/**
 * How a batch that did not succeed ended up in {@link BatchUpsertDocumentsResponse.errors}.
 *
 * - `rejected` — the request was sent and came back an error. The write may
 *   still have landed, since a response can be lost after Pinecone applied it;
 *   resending is safe because an upsert is idempotent by `_id`.
 * - `unsent` — the batch was never sent, because `totalTimeout` elapsed or
 *   because an earlier batch failed under `onError: 'throw'`.
 *
 * More values may be added, so the union stays open: do not match on it
 * exhaustively.
 */
export type BatchUpsertDisposition = 'rejected' | 'unsent' | (string & {});

/**
 * What a batched upsert does when a batch fails.
 *
 * - `collect` (default) — keep going, and report every failure on the resolved
 *   {@link BatchUpsertDocumentsResponse}.
 * - `throw` — stop sending new batches and reject with a
 *   {@link Errors.PineconeBatchUpsertError} carrying the partial response.
 */
export type BatchUpsertErrorMode = 'collect' | 'throw';

/**
 * One failed batch within a batched upsert.
 */
export interface BatchUpsertDocumentsError {
  /** Zero-based position of this batch in the chunked sequence. */
  batchIndex: number;
  /** The documents this batch carried, ready to be passed back in for a retry. */
  documents: Array<DocumentRecord>;
  /** Whether the batch reached Pinecone. See {@link BatchUpsertDisposition}. */
  disposition: BatchUpsertDisposition;
  /** What the attempt produced, or a {@link Errors.PineconeBatchUpsertUnsentError} for an unsent batch. */
  error: Error;
  /** `error.message`, lifted out so a failure can be logged or serialized without unwrapping. */
  errorMessage: string;
}

/**
 * The outcome of a batched upsert.
 */
export interface BatchUpsertDocumentsResponse {
  /** How many documents were passed in. */
  totalCount: number;
  /**
   * How many documents Pinecone reported as upserted, summed across the
   * batches that succeeded. This is the server's own count, so it can be lower
   * than the number of documents those batches carried.
   */
  upsertedCount: number;
  /** How many documents were in batches that failed or were never sent. */
  failedCount: number;
  /** How many batches the documents were chunked into. */
  totalBatchCount: number;
  /** How many batches succeeded. */
  successfulBatchCount: number;
  /** How many batches failed or were never sent. */
  failedBatchCount: number;
  /** One entry per failed batch, ordered by `batchIndex`. */
  errors: Array<BatchUpsertDocumentsError>;
  /**
   * Every document from every failed batch, flattened. Pass this straight back
   * to a batched upsert to retry only what did not land.
   */
  failedItems: Array<DocumentRecord>;
  /** Whether `totalTimeout` elapsed with batches still unsent. */
  timedOut: boolean;
}

/**
 * Options for a batched document upsert.
 *
 * The target namespace comes from the `Index` the call is made through, as it
 * does for every other document operation — chain `.namespace()` to change it.
 */
export interface BatchUpsertDocumentsOptions {
  /** The documents to upsert. An empty array resolves with zero counts and sends nothing. */
  documents: Array<DocumentRecord>;
  /** Documents per request, 1–1000. Defaults to 50. */
  batchSize?: number;
  /** Requests in flight at once, 1–64. Defaults to 8. */
  maxConcurrency?: number;
  /**
   * Deadline in **milliseconds** for the whole call. Once it elapses no further
   * batches are sent; batches already in flight are awaited rather than
   * cancelled, because dropping a request client-side does not stop Pinecone
   * from applying it. Defaults to no deadline.
   */
  totalTimeout?: number;
  /** What to do when a batch fails. Defaults to `collect`. */
  onError?: BatchUpsertErrorMode;
}

const requireIntegerInRange = (
  name: string,
  value: number,
  min: number,
  max: number,
): void => {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new PineconeArgumentError(
      `\`${name}\` must be an integer between ${min} and ${max}, inclusive. Received: ${String(value)}.`,
    );
  }
};

const chunk = (
  documents: Array<DocumentRecord>,
  size: number,
): Array<Array<DocumentRecord>> => {
  const batches: Array<Array<DocumentRecord>> = [];
  for (let i = 0; i < documents.length; i += size) {
    batches.push(documents.slice(i, i + size));
  }
  return batches;
};

const emptyResponse = (): BatchUpsertDocumentsResponse => ({
  totalCount: 0,
  upsertedCount: 0,
  failedCount: 0,
  totalBatchCount: 0,
  successfulBatchCount: 0,
  failedBatchCount: 0,
  errors: [],
  failedItems: [],
  timedOut: false,
});

const unsentError = (
  batchIndex: number,
  documents: Array<DocumentRecord>,
  expired: boolean,
  totalTimeout: number | undefined,
): BatchUpsertDocumentsError => {
  const cause = expired
    ? `\`totalTimeout\` of ${String(totalTimeout)}ms elapsed`
    : `an earlier batch failed and \`onError\` is 'throw'`;
  const message = `Batch ${batchIndex} was not sent because ${cause}, so its ${documents.length} document(s) were not upserted. Retry them with the documents in \`failedItems\`.`;
  return {
    batchIndex,
    documents,
    disposition: 'unsent',
    error: new PineconeBatchUpsertUnsentError(message),
    errorMessage: message,
  };
};

/**
 * Upserts documents in chunked, concurrent requests, collecting per-batch
 * failures instead of abandoning the rest on the first one.
 *
 * At most `maxConcurrency` requests are in flight; a worker picks up the next
 * batch as soon as its own request settles.
 *
 * @internal Callers reach this through the documents accessor on `Index`.
 */
export const batchUpsertDocuments = async (
  api: DocumentOperationsApi,
  namespace: string,
  options: BatchUpsertDocumentsOptions,
): Promise<BatchUpsertDocumentsResponse> => {
  if (!options || !Array.isArray(options.documents)) {
    throw new PineconeArgumentError(
      'You must pass a `documents` array to batchUpsert.',
    );
  }

  const batchSize = options.batchSize ?? DEFAULT_BATCH_UPSERT_BATCH_SIZE;
  const maxConcurrency =
    options.maxConcurrency ?? DEFAULT_BATCH_UPSERT_MAX_CONCURRENCY;
  const onError = options.onError ?? 'collect';
  const totalTimeout = options.totalTimeout;

  requireIntegerInRange('batchSize', batchSize, 1, MAX_BATCH_SIZE);
  requireIntegerInRange('maxConcurrency', maxConcurrency, 1, MAX_CONCURRENCY);
  if (onError !== 'collect' && onError !== 'throw') {
    throw new PineconeArgumentError(
      `\`onError\` must be either 'collect' or 'throw'. Received: ${String(onError)}.`,
    );
  }
  if (
    totalTimeout !== undefined &&
    (typeof totalTimeout !== 'number' ||
      !Number.isFinite(totalTimeout) ||
      totalTimeout <= 0)
  ) {
    throw new PineconeArgumentError(
      `\`totalTimeout\` must be a positive number of milliseconds. Received: ${String(totalTimeout)}.`,
    );
  }

  if (options.documents.length === 0) {
    return emptyResponse();
  }

  const batches = chunk(options.documents, batchSize);
  const deadline =
    totalTimeout === undefined ? undefined : Date.now() + totalTimeout;

  // A slot left `undefined` is how an unsent batch is detected: workers claim
  // batches in order, so a batch nobody claimed never had a request made for it.
  const outcomes: Array<number | BatchUpsertDocumentsError | undefined> =
    new Array(batches.length).fill(undefined);

  let nextBatch = 0;
  let expired = false;
  let aborted = false;

  const worker = async (): Promise<void> => {
    for (;;) {
      if (aborted) {
        return;
      }
      if (deadline !== undefined && Date.now() >= deadline) {
        expired = true;
        return;
      }
      const batchIndex = nextBatch;
      if (batchIndex >= batches.length) {
        return;
      }
      nextBatch += 1;
      const documents = batches[batchIndex];
      try {
        const { upsertedCount } = await upsertDocuments(api, namespace, {
          documents,
        });
        outcomes[batchIndex] = upsertedCount;
      } catch (e) {
        const error = e as Error;
        outcomes[batchIndex] = {
          batchIndex,
          documents,
          disposition: 'rejected',
          error,
          errorMessage: error.message,
        };
        if (onError === 'throw') {
          aborted = true;
          return;
        }
      }
    }
  };

  const workerCount = Math.min(maxConcurrency, batches.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  const errors: Array<BatchUpsertDocumentsError> = [];
  const failedItems: Array<DocumentRecord> = [];
  let upsertedCount = 0;
  let failedCount = 0;

  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const outcome = outcomes[batchIndex];
    if (typeof outcome === 'number') {
      upsertedCount += outcome;
      continue;
    }
    const documents = batches[batchIndex];
    const failure =
      outcome ?? unsentError(batchIndex, documents, expired, totalTimeout);
    errors.push(failure);
    failedItems.push(...documents);
    failedCount += documents.length;
  }

  const response: BatchUpsertDocumentsResponse = {
    totalCount: options.documents.length,
    upsertedCount,
    failedCount,
    totalBatchCount: batches.length,
    successfulBatchCount: batches.length - errors.length,
    failedBatchCount: errors.length,
    errors,
    failedItems,
    timedOut: expired && errors.some((e) => e.disposition === 'unsent'),
  };

  if (onError === 'throw' && errors.length > 0) {
    throw new PineconeBatchUpsertError(response);
  }

  return response;
};
