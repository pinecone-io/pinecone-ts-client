import { BasePineconeError } from './base';
import type { BatchUpsertDocumentsResponse } from '../data/documents/batchUpsertDocuments';

/**
 * An error containing the results of a failed batched document upsert.
 *
 * The batches already in flight when the failure surfaced are awaited before
 * this is thrown, so `response` is a complete account of what landed and what
 * did not — including the documents that were never sent.
 *
 * `cause` is the failure with the lowest `batchIndex`, which under a
 * `maxConcurrency` above 1 is not necessarily the rejection that stopped the
 * run. Read `response.errors` to see every failure.
 *
 * @example
 * ```typescript
 * import { Errors } from '@pinecone-database/pinecone';
 *
 * function reportBatchFailure(error: unknown) {
 *   if (error instanceof Errors.PineconeBatchUpsertError) {
 *     console.log(error.response.upsertedCount);
 *     console.log(error.response.failedItems);
 *   }
 * }
 * ```
 */
export class PineconeBatchUpsertError extends BasePineconeError {
  /** Counts and per-batch failures for the call that threw. */
  readonly response: BatchUpsertDocumentsResponse;

  /**
   * @param response - The partial result assembled before the call gave up.
   */
  constructor(response: BatchUpsertDocumentsResponse) {
    super(
      `Batched upsert failed: ${response.failedBatchCount} of ${response.totalBatchCount} batches did not land, leaving ${response.failedItems.length} document(s) unwritten. Inspect \`error.response.errors\` for the cause of each, and retry with \`error.response.failedItems\`.`,
      response.errors[0]?.error,
    );
    this.name = 'PineconeBatchUpsertError';
    this.response = response;
  }
}

/**
 * Recorded against a batch that a batched document upsert never sent, because
 * `totalTimeout` elapsed or because an earlier batch failed under
 * `onError: 'throw'`.
 *
 * It appears as the `error` of an entry in `response.errors` whose
 * `disposition` is `unsent`; it is never thrown.
 */
export class PineconeBatchUpsertUnsentError extends BasePineconeError {
  /**
   * @param message - Why the batch was left unsent, and how many documents it held.
   */
  constructor(message: string) {
    super(message);
    this.name = 'PineconeBatchUpsertUnsentError';
  }
}
