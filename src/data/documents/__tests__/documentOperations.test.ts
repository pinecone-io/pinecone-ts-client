import {
  DocumentOperationsApi,
  ResponseError,
  type UpsertDocumentsRequest,
  type UpsertDocumentsResponse,
  type SearchDocumentsRequest,
  type SearchDocumentsResponse,
  type FetchDocumentsRequest,
  type FetchDocumentsResponse,
  type ListDocumentsRequest,
  type ListDocumentsResponse,
  type UpdateDocumentsRequest,
  type UpdateDocumentsResponse,
  type DeleteDocumentsRequest,
  type DeleteDocumentsResponse,
} from '../../../pinecone-generated-ts-fetch/db_data';
import {
  PineconeBadRequestError,
  PineconeNotFoundError,
  PineconeConnectionError,
} from '../../../errors';
import { upsertDocuments } from '../upsertDocuments';
import { searchDocuments } from '../searchDocuments';
import { fetchDocuments } from '../fetchDocuments';
import { listDocuments } from '../listDocuments';
import { updateDocuments } from '../updateDocuments';
import { deleteDocuments } from '../deleteDocuments';

const namespace = 'tenant-a';
const filter = { category: { $eq: 'books' } };

// Keep each request typed against the generated model, while sharing the same
// transport/error assertions across the six independently wrapped operations.
const cases = [
  {
    operation: 'upsertDocuments',
    run: upsertDocuments,
    options: {
      documents: [{ _id: 'book-1', title: 'Dune', vector: [0.1, 0.2] }],
    } satisfies UpsertDocumentsRequest,
    response: { upsertedCount: 1 } satisfies UpsertDocumentsResponse,
    prefix: 'Error upserting documents into namespace tenant-a: ',
  },
  {
    operation: 'searchDocuments',
    run: searchDocuments,
    options: {
      scoreBy: [{ type: 'text', fields: ['title'], query: 'Dune' }],
      topK: 3,
      includeFields: ['title'],
      filter,
    } satisfies SearchDocumentsRequest,
    response: {
      matches: [{ _id: 'book-1', _score: 0.9, title: 'Dune' }],
      namespace,
      usage: { readUnits: 2 },
    } satisfies SearchDocumentsResponse,
    prefix: 'Error searching documents in namespace tenant-a: ',
  },
  {
    operation: 'fetchDocuments',
    run: fetchDocuments,
    options: {
      filter,
      includeFields: ['title'],
      paginationToken: 'page-1',
      limit: 10,
    } satisfies FetchDocumentsRequest,
    response: {
      documents: { 'book-1': { _id: 'book-1', title: 'Dune' } },
      namespace,
      usage: { readUnits: 1 },
      pagination: { next: 'page-2' },
    } satisfies FetchDocumentsResponse,
    prefix: 'Error fetching documents from namespace tenant-a: ',
  },
  {
    operation: 'listDocuments',
    run: listDocuments,
    options: {
      prefix: 'book-',
      limit: 10,
      paginationToken: 'page-1',
    } satisfies ListDocumentsRequest,
    response: {
      documents: [{ _id: 'book-1' }],
      namespace,
      usage: { readUnits: 1 },
      pagination: { next: 'page-2' },
    } satisfies ListDocumentsResponse,
    prefix: 'Error listing documents from namespace tenant-a: ',
  },
  {
    operation: 'updateDocuments',
    run: updateDocuments,
    options: {
      filter,
      setFields: { title: 'Dune Messiah' },
      removeFields: ['oldTitle'],
    } satisfies UpdateDocumentsRequest,
    response: { matchedRecords: 2 } satisfies UpdateDocumentsResponse,
    prefix: 'Error updating documents in namespace tenant-a: ',
  },
  {
    operation: 'deleteDocuments',
    run: deleteDocuments,
    options: { filter } satisfies DeleteDocumentsRequest,
    response: { matchedRecords: 2 } satisfies DeleteDocumentsResponse,
    prefix: 'Error deleting documents from namespace tenant-a: ',
  },
];

for (const { operation, run, options, response, prefix } of cases) {
  describe(operation, () => {
    const mockOperation = jest.fn();
    const api = {
      [operation]: mockOperation,
    } as unknown as DocumentOperationsApi;
    // The table pairs each function with a request checked above. The union of
    // function signatures otherwise requires the intersection of all requests.
    const invoke = () =>
      (
        run as (
          api: DocumentOperationsApi,
          namespace: string,
          options: object,
        ) => Promise<object>
      )(api, namespace, options);

    test('sends the exact namespace, request envelope, optional fields, and pinned API version', async () => {
      mockOperation.mockResolvedValue(response);
      const result = await invoke();
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(mockOperation).toHaveBeenCalledWith({
        namespace,
        [`${operation}Request`]: options,
        xPineconeApiVersion: '2026-07',
      });
      expect(result).toStrictEqual(response);
    });

    test('maps HTTP 404 to PineconeNotFoundError', async () => {
      mockOperation.mockRejectedValue(
        new ResponseError(
          new Response('missing', { status: 404 }),
          'request failed',
        ),
      );
      await expect(invoke()).rejects.toBeInstanceOf(PineconeNotFoundError);
    });

    test('preserves the operation and namespace in an HTTP 400 message', async () => {
      mockOperation.mockRejectedValue(
        new ResponseError(
          new Response(
            JSON.stringify({ error: { message: 'schema mismatch' } }),
            { status: 400 },
          ),
          'request failed',
        ),
      );
      await expect(invoke()).rejects.toEqual(
        new PineconeBadRequestError({
          message: `${prefix}schema mismatch`,
          status: 400,
        }),
      );
    });

    test('preserves an already mapped Pinecone error', async () => {
      const error = new PineconeBadRequestError({
        status: 400,
        message: 'middleware failure',
      });
      mockOperation.mockRejectedValue(error);
      await expect(invoke()).rejects.toBe(error);
    });

    test('maps transport failures to a connection error with the original cause', async () => {
      const cause = new Error('connection reset');
      mockOperation.mockRejectedValue(cause);
      await expect(invoke()).rejects.toMatchObject({
        name: 'PineconeConnectionError',
        cause,
      });
      mockOperation.mockRejectedValue(cause);
      await expect(invoke()).rejects.toBeInstanceOf(PineconeConnectionError);
    });
  });
}

describe('document selector request variants', () => {
  const mockOperation = jest.fn();

  test('fetches by IDs with a field projection', async () => {
    const api = {
      fetchDocuments: mockOperation,
    } as unknown as DocumentOperationsApi;
    await fetchDocuments(api, namespace, {
      ids: ['book-1', 'book-2'],
      includeFields: ['*'],
    });
    expect(mockOperation).toHaveBeenCalledWith({
      namespace,
      fetchDocumentsRequest: {
        ids: ['book-1', 'book-2'],
        includeFields: ['*'],
      },
      xPineconeApiVersion: '2026-07',
    });
  });

  test('forwards per-document updates and field removals and returns the empty response', async () => {
    const api = {
      updateDocuments: mockOperation,
    } as unknown as DocumentOperationsApi;
    mockOperation.mockResolvedValue({});
    const documents = [
      { _id: 'book-1', title: 'Dune Messiah', _remove_fields: ['oldTitle'] },
    ];
    await expect(
      updateDocuments(api, namespace, { documents }),
    ).resolves.toStrictEqual({});
    expect(mockOperation).toHaveBeenCalledWith({
      namespace,
      updateDocumentsRequest: { documents },
      xPineconeApiVersion: '2026-07',
    });
  });

  test.each([
    { ids: ['book-1'] },
    { deleteAll: true },
    { ids: ['book-1'], deleteAll: false },
  ])(
    'forwards delete selector %j and returns the empty response',
    async (options) => {
      const api = {
        deleteDocuments: mockOperation,
      } as unknown as DocumentOperationsApi;
      mockOperation.mockResolvedValue({});
      await expect(
        deleteDocuments(api, namespace, options),
      ).resolves.toStrictEqual({});
      expect(mockOperation).toHaveBeenCalledWith({
        namespace,
        deleteDocumentsRequest: options,
        xPineconeApiVersion: '2026-07',
      });
    },
  );

  test.each(['updateDocuments', 'deleteDocuments'] as const)(
    '%s preserves a zero matched count',
    async (operation) => {
      const api = {
        [operation]: mockOperation,
      } as unknown as DocumentOperationsApi;
      mockOperation.mockResolvedValue({ matchedRecords: 0 });
      const result =
        operation === 'updateDocuments'
          ? updateDocuments(api, namespace, {
              filter,
              setFields: { title: 'Dune' },
            })
          : deleteDocuments(api, namespace, { filter });
      await expect(result).resolves.toStrictEqual({ matchedRecords: 0 });
    },
  );

  test('lists without options using an empty request envelope', async () => {
    const api = {
      listDocuments: mockOperation,
    } as unknown as DocumentOperationsApi;
    await listDocuments(api, namespace);
    expect(mockOperation).toHaveBeenCalledWith({
      namespace,
      listDocumentsRequest: {},
      xPineconeApiVersion: '2026-07',
    });
  });
});
