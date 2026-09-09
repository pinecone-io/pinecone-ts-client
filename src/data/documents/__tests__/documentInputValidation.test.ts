import type {
  DocumentOperationsApi,
  UpsertDocumentsRequest,
  SearchDocumentsRequest,
} from '../../../pinecone-generated-ts-fetch/db_data';
import { upsertDocuments } from '../upsertDocuments';
import { searchDocuments } from '../searchDocuments';
import { listDocuments } from '../listDocuments';

const scoreBy = [{ type: 'text', fields: ['title'], query: 'Dune' }];

describe('upsertDocuments argument validation', () => {
  const upsert = jest.fn();
  const api = { upsertDocuments: upsert } as unknown as DocumentOperationsApi;

  test.each([{ documents: [] }, {}])(
    'rejects empty or missing documents: %j',
    async (options) => {
      await expect(
        upsertDocuments(api, 'ns', options as UpsertDocumentsRequest),
      ).rejects.toMatchObject({
        name: 'PineconeArgumentError',
        message:
          'You must pass a non-empty `documents` array to upsertDocuments.',
      });
      expect(upsert).not.toHaveBeenCalled();
    },
  );
});

describe('searchDocuments argument validation', () => {
  const search = jest.fn();
  const api = { searchDocuments: search } as unknown as DocumentOperationsApi;

  test.each([{ scoreBy: [], topK: 1 }, { topK: 1 }])(
    'rejects empty or missing scoring: %j',
    async (options) => {
      await expect(
        searchDocuments(api, 'ns', options as SearchDocumentsRequest),
      ).rejects.toMatchObject({
        name: 'PineconeArgumentError',
        message:
          'You must pass a non-empty `scoreBy` array to searchDocuments.',
      });
      expect(search).not.toHaveBeenCalled();
    },
  );

  test.each([undefined, null, 0, -1])('rejects topK %s', async (topK) => {
    await expect(
      searchDocuments(api, 'ns', { scoreBy, topK } as SearchDocumentsRequest),
    ).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message: '`topK` must be a positive integer of at least 1.',
    });
    expect(search).not.toHaveBeenCalled();
  });

  test('accepts the minimum topK', async () => {
    await searchDocuments(api, 'ns', { scoreBy, topK: 1 });
    expect(search).toHaveBeenCalledWith({
      namespace: 'ns',
      searchDocumentsRequest: { scoreBy, topK: 1 },
      xPineconeApiVersion: '2026-07',
    });
  });
});

describe('listDocuments argument validation', () => {
  const list = jest.fn();
  const api = { listDocuments: list } as unknown as DocumentOperationsApi;

  test.each([0, -5])('rejects limit %s', async (limit) => {
    await expect(listDocuments(api, 'ns', { limit })).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message: '`limit` must be a positive integer of at least 1.',
    });
    expect(list).not.toHaveBeenCalled();
  });

  test.each([{}, { limit: 1 }])(
    'accepts an omitted or minimum limit: %j',
    async (options) => {
      await listDocuments(api, 'ns', options);
      expect(list).toHaveBeenCalledWith({
        namespace: 'ns',
        listDocumentsRequest: options,
        xPineconeApiVersion: '2026-07',
      });
    },
  );
});
