import {
  PineconeIndexInitializationFailedError,
  PineconeIndexTerminatedError,
  PineconeTimeoutError,
} from '../errors';

/** Minimal structural type that both stable and alpha IndexModel satisfy. */
export type IndexReadinessResponse = {
  status?: { ready?: boolean; state?: string };
};

const TERMINAL_FAILED_STATES = new Set(['InitializationFailed']);
const TERMINAL_TERMINATED_STATES = new Set(['Terminating', 'Disabled']);

/**
 * Polls `describeFn` until the index is ready, a terminal state is reached,
 * or the optional timeout elapses.
 *
 * @param describeFn - Zero-argument async function that calls the API's describeIndex and returns the model.
 * @param indexName - Index name, used only in error messages.
 * @param timeoutMs - Maximum ms to wait. Omit (or pass `undefined`) to poll indefinitely.
 * @param pollIntervalMs - Ms between successive describe calls. Defaults to 5000.
 */
export async function pollUntilIndexIsReady<T extends IndexReadinessResponse>(
  describeFn: () => Promise<T>,
  indexName: string,
  timeoutMs?: number,
  pollIntervalMs = 5000,
): Promise<T> {
  const start = Date.now();

  while (timeoutMs === undefined || Date.now() - start < timeoutMs) {
    const model = await describeFn();
    const state = model.status?.state;

    if (model.status?.ready) {
      return model;
    }
    if (state && TERMINAL_FAILED_STATES.has(state)) {
      throw new PineconeIndexInitializationFailedError(indexName);
    }
    if (state && TERMINAL_TERMINATED_STATES.has(state)) {
      throw new PineconeIndexTerminatedError(indexName, state);
    }

    await new Promise((r) => setTimeout(r, pollIntervalMs));
  }

  throw new PineconeTimeoutError(indexName, timeoutMs as number);
}
