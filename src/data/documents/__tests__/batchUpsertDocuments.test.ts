import type {
  DocumentOperationsApi,
  DocumentRecord,
} from '../../../pinecone-generated-ts-fetch/db_data';
import {
  PineconeArgumentError,
  PineconeBatchUpsertError,
  PineconeBatchUpsertUnsentError,
  PineconeConnectionError,
} from '../../../errors';
import {
  batchUpsertDocuments,
  DEFAULT_BATCH_UPSERT_BATCH_SIZE,
  DEFAULT_BATCH_UPSERT_MAX_CONCURRENCY,
} from '../batchUpsertDocuments';

const namespace = 'tenant-a';

const docs = (count: number, offset = 0): Array<DocumentRecord> =>
  Array.from({ length: count }, (_, i) => ({
    _id: `doc-${i + offset}`,
    title: `Document ${i + offset}`,
  }));

type UpsertCall = { namespace: string; documents: Array<DocumentRecord> };

const fakeApi = (
  handler: (call: UpsertCall) => Promise<{ upsertedCount: number }>,
): { api: DocumentOperationsApi; calls: Array<UpsertCall> } => {
  const calls: Array<UpsertCall> = [];
  const api = {
    upsertDocuments: (req: {
      namespace: string;
      upsertDocumentsRequest: { documents: Array<DocumentRecord> };
    }) => {
      const call = {
        namespace: req.namespace,
        documents: req.upsertDocumentsRequest.documents,
      };
      calls.push(call);
      return handler(call);
    },
  } as unknown as DocumentOperationsApi;
  return { api, calls };
};

const alwaysSucceeds = (call: UpsertCall) =>
  Promise.resolve({ upsertedCount: call.documents.length });

describe('batchUpsertDocuments', () => {
  describe('input handling', () => {
    test('an empty documents array resolves with zero counts and sends nothing', async () => {
      const { api, calls } = fakeApi(alwaysSucceeds);

      const response = await batchUpsertDocuments(api, namespace, {
        documents: [],
      });

      expect(calls).toEqual([]);
      expect(response).toEqual({
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
    });

    test('documents that fit in one batch produce exactly one request', async () => {
      const { api, calls } = fakeApi(alwaysSucceeds);
      const documents = docs(DEFAULT_BATCH_UPSERT_BATCH_SIZE);

      const response = await batchUpsertDocuments(api, namespace, {
        documents,
      });

      expect(calls).toHaveLength(1);
      expect(calls[0].namespace).toEqual(namespace);
      expect(calls[0].documents).toEqual(documents);
      expect(response.totalBatchCount).toEqual(1);
      expect(response.upsertedCount).toEqual(DEFAULT_BATCH_UPSERT_BATCH_SIZE);
      expect(response.errors).toEqual([]);
    });

    test('one more document than the default batch size splits into two requests', async () => {
      const { api, calls } = fakeApi(alwaysSucceeds);

      const response = await batchUpsertDocuments(api, namespace, {
        documents: docs(DEFAULT_BATCH_UPSERT_BATCH_SIZE + 1),
      });

      expect(calls.map((c) => c.documents.length)).toEqual([
        DEFAULT_BATCH_UPSERT_BATCH_SIZE,
        1,
      ]);
      expect(response.totalBatchCount).toEqual(2);
      expect(response.successfulBatchCount).toEqual(2);
    });

    test.each([
      ['batchSize', { batchSize: 0 }],
      ['batchSize', { batchSize: 1001 }],
      ['batchSize', { batchSize: 1.5 }],
      ['maxConcurrency', { maxConcurrency: 0 }],
      ['maxConcurrency', { maxConcurrency: 65 }],
      ['totalTimeout', { totalTimeout: 0 }],
      ['totalTimeout', { totalTimeout: -1 }],
    ])('%s outside its accepted range is rejected', async (name, override) => {
      const { api, calls } = fakeApi(alwaysSucceeds);

      await expect(
        batchUpsertDocuments(api, namespace, {
          documents: docs(2),
          ...override,
        }),
      ).rejects.toThrow(new RegExp(`\`${name}\``));
      expect(calls).toEqual([]);
    });

    test('an unrecognized onError mode is rejected before any request', async () => {
      const { api, calls } = fakeApi(alwaysSucceeds);

      await expect(
        batchUpsertDocuments(api, namespace, {
          documents: docs(2),
          onError: 'ignore' as 'collect',
        }),
      ).rejects.toThrow(PineconeArgumentError);
      expect(calls).toEqual([]);
    });

    test('a missing documents array is rejected', async () => {
      const { api } = fakeApi(alwaysSucceeds);

      await expect(
        batchUpsertDocuments(api, namespace, {} as { documents: [] }),
      ).rejects.toThrow(PineconeArgumentError);
    });
  });

  describe("onError: 'collect'", () => {
    test('the batches after a failure still run, and the failure is reported', async () => {
      const boom = new Error('backend said no');
      const { api, calls } = fakeApi((call) =>
        call.documents[0]._id === 'doc-2'
          ? Promise.reject(boom)
          : alwaysSucceeds(call),
      );

      const response = await batchUpsertDocuments(api, namespace, {
        documents: docs(5),
        batchSize: 1,
        maxConcurrency: 1,
      });

      expect(calls).toHaveLength(5);
      expect(response.totalCount).toEqual(5);
      expect(response.upsertedCount).toEqual(4);
      expect(response.failedCount).toEqual(1);
      expect(response.successfulBatchCount).toEqual(4);
      expect(response.failedBatchCount).toEqual(1);
      expect(response.timedOut).toEqual(false);
      expect(response.errors).toHaveLength(1);
      expect(response.errors[0].batchIndex).toEqual(2);
      expect(response.errors[0].disposition).toEqual('rejected');
      expect(response.errors[0].error).toBeInstanceOf(PineconeConnectionError);
      expect(response.errors[0].errorMessage).toEqual(
        response.errors[0].error.message,
      );
    });

    test('failedItems carries the documents themselves, so a retry needs no id lookup', async () => {
      const { api } = fakeApi((call) =>
        call.documents[0]._id === 'doc-0'
          ? Promise.reject(new Error('rejected'))
          : alwaysSucceeds(call),
      );
      const documents = docs(4);

      const response = await batchUpsertDocuments(api, namespace, {
        documents,
        batchSize: 2,
      });

      expect(response.failedItems).toEqual([documents[0], documents[1]]);
      expect(response.errors[0].documents).toEqual([
        documents[0],
        documents[1],
      ]);
      expect(response.failedCount).toEqual(2);
    });

    test('errors are ordered by batchIndex however the requests settled', async () => {
      const { api } = fakeApi((call) =>
        Promise.reject(new Error(`failed ${call.documents[0]._id}`)),
      );

      const response = await batchUpsertDocuments(api, namespace, {
        documents: docs(4),
        batchSize: 1,
        maxConcurrency: 4,
      });

      expect(response.errors.map((e) => e.batchIndex)).toEqual([0, 1, 2, 3]);
      expect(response.successfulBatchCount).toEqual(0);
      expect(response.upsertedCount).toEqual(0);
    });

    test('upsertedCount reports the server count, not the documents sent', async () => {
      const { api } = fakeApi(() => Promise.resolve({ upsertedCount: 1 }));

      const response = await batchUpsertDocuments(api, namespace, {
        documents: docs(4),
        batchSize: 2,
      });

      expect(response.totalCount).toEqual(4);
      expect(response.upsertedCount).toEqual(2);
    });
  });

  describe("onError: 'throw'", () => {
    test('rejects with the partial response, leaving later batches unsent', async () => {
      const { api, calls } = fakeApi((call) =>
        call.documents[0]._id === 'doc-1'
          ? Promise.reject(new Error('backend said no'))
          : alwaysSucceeds(call),
      );

      let error: PineconeBatchUpsertError | undefined;
      try {
        await batchUpsertDocuments(api, namespace, {
          documents: docs(5),
          batchSize: 1,
          maxConcurrency: 1,
          onError: 'throw',
        });
      } catch (e) {
        error = e as PineconeBatchUpsertError;
      }

      expect(error).toBeInstanceOf(PineconeBatchUpsertError);
      if (!error) throw new Error('unreachable');
      expect(calls).toHaveLength(2);
      expect(error.response.upsertedCount).toEqual(1);
      expect(error.response.failedCount).toEqual(4);
      expect(error.response.failedItems).toHaveLength(4);
      expect(error.response.timedOut).toEqual(false);
      expect(
        error.response.errors.map((e) => [e.batchIndex, e.disposition]),
      ).toEqual([
        [1, 'rejected'],
        [2, 'unsent'],
        [3, 'unsent'],
        [4, 'unsent'],
      ]);
      expect(error.response.errors[2].error).toBeInstanceOf(
        PineconeBatchUpsertUnsentError,
      );
      expect(error.message).toContain('4 of 5 batches did not land');
    });

    test('resolves normally when nothing fails', async () => {
      const { api } = fakeApi(alwaysSucceeds);

      const response = await batchUpsertDocuments(api, namespace, {
        documents: docs(4),
        batchSize: 2,
        onError: 'throw',
      });

      expect(response.upsertedCount).toEqual(4);
      expect(response.errors).toEqual([]);
    });
  });

  describe('concurrency', () => {
    const trackingApi = () => {
      let inFlight = 0;
      let peak = 0;
      const release: Array<() => void> = [];
      const { api, calls } = fakeApi((call) => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        return new Promise((resolve) => {
          release.push(() => {
            inFlight--;
            resolve({ upsertedCount: call.documents.length });
          });
        });
      });
      return { api, calls, release, peak: () => peak };
    };

    test('never exceeds maxConcurrency requests in flight', async () => {
      const { api, calls, release, peak } = trackingApi();

      const pending = batchUpsertDocuments(api, namespace, {
        documents: docs(20),
        batchSize: 1,
        maxConcurrency: 3,
      });

      await Promise.resolve();
      expect(calls).toHaveLength(3);

      while (release.length > 0) {
        release.shift()!();
        await Promise.resolve();
        await Promise.resolve();
      }
      await pending;

      expect(peak()).toEqual(3);
      expect(calls).toHaveLength(20);
    });

    test('defaults to the documented ceiling when maxConcurrency is omitted', async () => {
      const { api, calls, release } = trackingApi();

      const pending = batchUpsertDocuments(api, namespace, {
        documents: docs(40),
        batchSize: 1,
      });

      await Promise.resolve();
      expect(calls).toHaveLength(DEFAULT_BATCH_UPSERT_MAX_CONCURRENCY);

      while (release.length > 0) {
        release.shift()!();
        await Promise.resolve();
        await Promise.resolve();
      }
      await pending;
      expect(calls).toHaveLength(40);
    });

    test('runs no more workers than there are batches', async () => {
      const { api, calls, release } = trackingApi();

      const pending = batchUpsertDocuments(api, namespace, {
        documents: docs(2),
        batchSize: 1,
        maxConcurrency: 16,
      });

      await Promise.resolve();
      expect(calls).toHaveLength(2);

      while (release.length > 0) {
        release.shift()!();
        await Promise.resolve();
      }
      await expect(pending).resolves.toMatchObject({ upsertedCount: 2 });
    });
  });

  describe('totalTimeout', () => {
    let clock: number;

    beforeEach(() => {
      clock = 0;
      jest.spyOn(Date, 'now').mockImplementation(() => clock);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('stops admitting batches, returns what completed, and marks the rest unsent', async () => {
      const { api, calls } = fakeApi((call) => {
        clock += 10;
        return Promise.resolve({ upsertedCount: call.documents.length });
      });

      const response = await batchUpsertDocuments(api, namespace, {
        documents: docs(5),
        batchSize: 1,
        maxConcurrency: 1,
        totalTimeout: 25,
      });

      expect(calls).toHaveLength(3);
      expect(response.timedOut).toEqual(true);
      expect(response.upsertedCount).toEqual(3);
      expect(response.failedCount).toEqual(2);
      expect(response.errors.map((e) => [e.batchIndex, e.disposition])).toEqual(
        [
          [3, 'unsent'],
          [4, 'unsent'],
        ],
      );
      expect(response.errors[0].errorMessage).toContain(
        '`totalTimeout` of 25ms elapsed',
      );
      expect(response.failedItems.map((d) => d._id)).toEqual([
        'doc-3',
        'doc-4',
      ]);
    });

    test('a batch already in flight when the deadline passes is awaited, not dropped', async () => {
      let resolveFirst: (() => void) | undefined;
      const { api, calls } = fakeApi(
        (call) =>
          new Promise((resolve) => {
            resolveFirst = () => {
              clock += 100;
              resolve({ upsertedCount: call.documents.length });
            };
          }),
      );

      const pending = batchUpsertDocuments(api, namespace, {
        documents: docs(3),
        batchSize: 1,
        maxConcurrency: 1,
        totalTimeout: 50,
      });

      await Promise.resolve();
      expect(calls).toHaveLength(1);
      resolveFirst!();

      const response = await pending;
      expect(calls).toHaveLength(1);
      expect(response.upsertedCount).toEqual(1);
      expect(response.timedOut).toEqual(true);
      expect(response.failedBatchCount).toEqual(2);
    });

    test('timedOut stays false when the deadline passes with nothing left to send', async () => {
      const { api } = fakeApi((call) => {
        clock += 100;
        return Promise.resolve({ upsertedCount: call.documents.length });
      });

      const response = await batchUpsertDocuments(api, namespace, {
        documents: docs(2),
        batchSize: 2,
        totalTimeout: 50,
      });

      expect(response.timedOut).toEqual(false);
      expect(response.upsertedCount).toEqual(2);
      expect(response.errors).toEqual([]);
    });
  });
});
