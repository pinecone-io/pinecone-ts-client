import {
  cleanupResources,
  retryDelete,
  waitForReady,
  waitUntilRecordsReady,
  assertWithRetries,
} from '../integration/test-helpers';
import { Pinecone, Index } from '../index';
import {
  PineconeNotFoundError,
  PineconeConflictError,
  PineconeAuthorizationError,
} from '../errors';

describe('integration polling and cleanup', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('polls readiness until success', async () => {
    const describe = jest
      .fn()
      .mockResolvedValueOnce({ ready: false, state: 'Initializing' })
      .mockResolvedValue({ ready: true, state: 'Ready' });
    const result = waitForReady(describe, 'index', 1000);
    await jest.advanceTimersByTimeAsync(1000);
    await result;
    expect(describe).toHaveBeenCalledTimes(2);
  });

  test('reports the last observed state when readiness times out', async () => {
    const describe = jest
      .fn()
      .mockResolvedValue({ ready: false, state: 'Initializing' });
    const result = expect(
      waitForReady(describe, 'index abc', 1500),
    ).rejects.toThrow('index abc; last state: Initializing');
    await jest.advanceTimersByTimeAsync(1500);
    await result;
    expect(describe).toHaveBeenCalledTimes(3);
  });

  test('stops immediately on terminal state or request failure', async () => {
    await expect(
      waitForReady(
        async () => ({ ready: false, state: 'Failed' }),
        'assistant',
      ),
    ).rejects.toThrow('terminal state');
    const error = new Error('unauthorized');
    await expect(
      waitForReady(async () => {
        throw error;
      }, 'index'),
    ).rejects.toBe(error);
    expect(jest.getTimerCount()).toBe(0);
  });

  test('missing namespaces never indicate records are ready', async () => {
    const index = {
      describeIndexStats: jest.fn().mockResolvedValue({}),
    } as unknown as Index;
    const result = expect(
      waitUntilRecordsReady(index, 'ns', ['id'], 1000),
    ).rejects.toThrow('observed no namespace');
    await jest.advanceTimersByTimeAsync(1000);
    await result;
  });

  test('already absent resources are successfully cleaned', async () => {
    const remove = jest
      .fn()
      .mockRejectedValue(new PineconeNotFoundError({ status: 404 }));
    await retryDelete(remove, 'index');
    expect(remove).toHaveBeenCalledTimes(1);
  });

  test('transient deletion failures retry, then succeed', async () => {
    const remove = jest
      .fn()
      .mockRejectedValueOnce(new PineconeConflictError({ status: 409 }))
      .mockResolvedValue(undefined);
    const result = retryDelete(remove, 'index', 1000);
    await jest.advanceTimersByTimeAsync(1000);
    await result;
    expect(remove).toHaveBeenCalledTimes(2);
  });

  test('deletion retry exhaustion retains original error', async () => {
    const error = new PineconeConflictError({ status: 409 });
    const remove = jest.fn().mockRejectedValue(error);
    const result = expect(
      retryDelete(remove, 'index abc', 1000),
    ).rejects.toMatchObject({
      message: 'Failed to delete index abc',
      cause: error,
    });
    await jest.advanceTimersByTimeAsync(1000);
    await result;
    expect(remove).toHaveBeenCalledTimes(2);
  });

  test('cleanup attempts every resource and reports permanent failures', async () => {
    const deleteIndex = jest
      .fn()
      .mockRejectedValue(new PineconeAuthorizationError({ status: 401 }));
    const deleteAssistant = jest.fn().mockResolvedValue(undefined);
    const pc = {
      indexes: { delete: deleteIndex },
      assistants: { delete: deleteAssistant },
    } as unknown as Pinecone;
    await expect(cleanupResources(pc, ['a', 'b'], ['c'])).rejects.toThrow(
      AggregateError,
    );
    expect(deleteIndex.mock.calls).toEqual([['a'], ['b']]);
    expect(deleteAssistant).toHaveBeenCalledWith('c');
    expect(jest.getTimerCount()).toBe(0);
  });

  test('assertion retries include request time in their budget', async () => {
    const error = new Error('not visible');
    const operation = jest.fn(async () => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      throw error;
    });
    const result = expect(
      assertWithRetries(operation, () => undefined, 1000, 500),
    ).rejects.toBe(error);
    await jest.advanceTimersByTimeAsync(1000);
    await result;
    expect(operation).toHaveBeenCalledTimes(1);
  });
});
