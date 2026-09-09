import { Index, Pinecone, SearchDocumentsOptions } from '../index';
import {
  PineconeBadRequestError,
  PineconeMaxRetriesExceededError,
} from '../errors';

const host = 'https://documents.test.pinecone.io';
const namespace = 'wire smoke/東京';
const document = { _id: 'doc-1', title: 'Hello', embedding: [0.1, 0.2] };
const usage = { read_units: 2 };

type Operation = {
  name: string;
  call: (index: Index) => Promise<unknown>;
  body: object;
  response: object;
  expected: unknown;
};
const operations: Operation[] = [
  {
    name: 'upsert',
    call: (index) => index.upsertDocuments({ documents: [document] }),
    body: { documents: [document] },
    response: { upserted_count: 1 },
    expected: { upsertedCount: 1 },
  },
  {
    name: 'search',
    call: (index) =>
      index.searchDocuments({
        scoreBy: [{ type: 'text', fields: ['title'], query: 'Hello' }],
        topK: 2,
        includeFields: ['title'],
        filter: { category: 'news' },
      }),
    body: {
      score_by: [{ type: 'text', fields: ['title'], query: 'Hello' }],
      top_k: 2,
      include_fields: ['title'],
      filter: { category: 'news' },
    },
    response: { matches: [{ ...document, _score: 0.5 }], namespace, usage },
    expected: {
      matches: [{ ...document, _score: 0.5 }],
      namespace,
      usage: { readUnits: 2 },
    },
  },
  {
    name: 'fetch',
    call: (index) =>
      index.fetchDocuments({
        filter: { category: 'news' },
        paginationToken: 'fetch-cursor',
        includeFields: ['title'],
        limit: 1,
      }),
    body: {
      filter: { category: 'news' },
      pagination_token: 'fetch-cursor',
      include_fields: ['title'],
      limit: 1,
    },
    response: {
      documents: { 'doc-1': document },
      namespace,
      usage,
      pagination: { next: 'fetch-next' },
    },
    expected: {
      documents: { 'doc-1': document },
      namespace,
      usage: { readUnits: 2 },
      pagination: { next: 'fetch-next' },
    },
  },
  {
    name: 'list',
    call: (index) =>
      index.listDocuments({
        prefix: 'doc-',
        limit: 1,
        paginationToken: 'list-cursor',
      }),
    body: { prefix: 'doc-', limit: 1, pagination_token: 'list-cursor' },
    response: {
      documents: [{ _id: 'doc-1' }],
      namespace,
      usage,
      pagination: { next: 'list-next' },
    },
    expected: {
      documents: [{ _id: 'doc-1' }],
      namespace,
      usage: { readUnits: 2 },
      pagination: { next: 'list-next' },
    },
  },
  {
    name: 'update',
    call: (index) =>
      index.updateDocuments({
        filter: { category: 'news' },
        setFields: { title: 'Updated' },
        removeFields: ['oldTitle'],
      }),
    body: {
      filter: { category: 'news' },
      set_fields: { title: 'Updated' },
      remove_fields: ['oldTitle'],
    },
    response: { matched_records: 1 },
    expected: { matchedRecords: 1 },
  },
  {
    name: 'delete',
    call: (index) => index.deleteDocuments({ deleteAll: true }),
    body: { delete_all: true },
    response: { matched_records: 1 },
    expected: { matchedRecords: 1 },
  },
];

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
const client = (fetchApi: typeof fetch, maxRetries = 0) =>
  new Pinecone({ apiKey: 'mock-wire-key', fetchApi, maxRetries })
    .index({ host, additionalHeaders: { 'x-tenant': 'customer' } })
    .namespace(namespace);
const expectWire = (mock: jest.Mock, operation: Operation) => {
  for (const [url, init] of mock.mock.calls) {
    expect(url).toBe(
      `${host}/namespaces/${encodeURIComponent(namespace)}/documents/${operation.name}`,
    );
    expect(init.method).toBe('POST');
    expect(new Headers(init.headers).get('x-tenant')).toBe('customer');
    expect(new Headers(init.headers).get('X-Pinecone-Api-Version')).toBe(
      '2026-07',
    );
    expect(JSON.parse(init.body)).toEqual(operation.body);
  }
};

describe.each(operations)('$name documents wire contract', (operation) => {
  test('serializes the request and decodes the response through the public client', async () => {
    const transport = jest
      .fn()
      .mockImplementation(async () => json(operation.response));
    await expect(operation.call(client(transport))).resolves.toEqual(
      operation.expected,
    );
    expect(transport).toHaveBeenCalledTimes(1);
    expectWire(transport, operation);
  });

  test('replays the same body after a 503 and preserves decoded success', async () => {
    const transport = jest
      .fn()
      .mockImplementationOnce(async () =>
        json({ error: { code: 'UNAVAILABLE', message: 'Try again' } }, 503),
      )
      .mockImplementationOnce(async () => json(operation.response));
    await expect(operation.call(client(transport, 1))).resolves.toEqual(
      operation.expected,
    );
    expect(transport).toHaveBeenCalledTimes(2);
    expectWire(transport, operation);
  });

  test('stops at its retry budget on repeated nested 5xx errors', async () => {
    const transport = jest
      .fn()
      .mockImplementation(async () =>
        json(
          { status: 500, error: { code: 'INTERNAL', message: 'Unavailable' } },
          500,
        ),
      );
    await expect(operation.call(client(transport, 1))).rejects.toBeInstanceOf(
      PineconeMaxRetriesExceededError,
    );
    expect(transport).toHaveBeenCalledTimes(2);
    expectWire(transport, operation);
  });

  test('does not retry a nested 400 error and retains the API message', async () => {
    const transport = jest.fn().mockImplementation(async () =>
      json(
        {
          status: 400,
          error: {
            code: 'INVALID_ARGUMENT',
            message: 'Invalid document request',
          },
        },
        400,
      ),
    );
    const result = operation.call(client(transport, 3));
    await expect(result).rejects.toBeInstanceOf(PineconeBadRequestError);
    await expect(result).rejects.toHaveProperty(
      'message',
      'Invalid document request',
    );
    expect(transport).toHaveBeenCalledTimes(1);
  });
});

const scoring: SearchDocumentsOptions['scoreBy'][] = [
  [{ type: 'dense_vector', fields: ['embedding'], values: [0.1, 0.2] }],
  [
    {
      type: 'sparse_vector',
      fields: ['sparse'],
      sparseValues: { indices: [1, 9], values: [0.5, 0.7] },
    },
  ],
  [{ type: 'text', fields: ['title'], query: 'Hello' }],
  [{ type: 'query_string', query: 'title:Hello' }],
  [
    { type: 'dense_vector', fields: ['embedding'], values: [0.1, 0.2] },
    { type: 'text', fields: ['title'], query: 'Hello' },
  ],
];
test.each(
  scoring.map((scoreBy, index) => ({
    scoreBy,
    wire:
      index === 1
        ? [
            {
              type: 'sparse_vector',
              fields: ['sparse'],
              sparse_values: { indices: [1, 9], values: [0.5, 0.7] },
            },
          ]
        : scoreBy,
  })),
)('preserves scoring clauses $scoreBy', async ({ scoreBy, wire }) => {
  const transport = jest
    .fn()
    .mockImplementation(async () => json({ matches: [], namespace, usage }));
  await client(transport).searchDocuments({ scoreBy, topK: 3 });
  expect(JSON.parse(transport.mock.calls[0][1].body)).toEqual({
    score_by: wire,
    top_k: 3,
  });
});
