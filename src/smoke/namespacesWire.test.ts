import { Index, Pinecone } from '../index';

const host = 'https://namespaces.test.pinecone.io';
const namespace = 'tenant / 東京';
const wireDescription = {
  name: namespace,
  record_count: '12',
  schema: { fields: { category: { filterable: true } } },
};
const description = {
  name: namespace,
  recordCount: '12',
  schema: { fields: { category: { filterable: true } } },
};
const operations: Array<{
  name: string;
  call: (index: Index) => Promise<unknown>;
  method: string;
  path: string;
  body?: object;
  response: object;
  expected: unknown;
}> = [
  {
    name: 'create',
    call: (index) =>
      index.createNamespace({
        name: namespace,
        schema: { fields: { category: { filterable: true } } },
      }),
    method: 'POST',
    path: '/namespaces',
    body: {
      name: namespace,
      schema: { fields: { category: { filterable: true } } },
    },
    response: wireDescription,
    expected: description,
  },
  {
    name: 'describe',
    call: (index) => index.describeNamespace(namespace),
    method: 'GET',
    path: `/namespaces/${encodeURIComponent(namespace)}`,
    response: wireDescription,
    expected: description,
  },
  {
    name: 'delete',
    call: (index) => index.deleteNamespace(namespace),
    method: 'DELETE',
    path: `/namespaces/${encodeURIComponent(namespace)}`,
    response: {},
    expected: undefined,
  },
  {
    name: 'list',
    call: (index) =>
      index.listNamespaces({
        limit: 2,
        prefix: 'tenant',
        paginationToken: 'next/page',
      }),
    method: 'GET',
    path: '/namespaces?limit=2&paginationToken=next%2Fpage&prefix=tenant',
    response: {
      namespaces: [wireDescription],
      pagination: { next: 'another-page' },
    },
    expected: {
      namespaces: [description],
      pagination: { next: 'another-page' },
    },
  },
];

test.each(operations)(
  'namespace $name uses the 2026-07 wire contract',
  async (operation) => {
    const transport = jest.fn().mockImplementation(
      async () =>
        new Response(JSON.stringify(operation.response), {
          headers: { 'Content-Type': 'application/json' },
        }),
    );
    const index = new Pinecone({
      apiKey: 'mock-key',
      fetchApi: transport,
      maxRetries: 0,
    }).index({ host });
    await expect(operation.call(index)).resolves.toEqual(operation.expected);
    expect(transport).toHaveBeenCalledTimes(1);
    const [url, init] = transport.mock.calls[0];
    expect(url).toBe(`${host}${operation.path}`);
    expect(init.method).toBe(operation.method);
    expect(new Headers(init.headers).get('X-Pinecone-Api-Version')).toBe(
      '2026-07',
    );
    expect(init.body === undefined ? undefined : JSON.parse(init.body)).toEqual(
      operation.body,
    );
  },
);
