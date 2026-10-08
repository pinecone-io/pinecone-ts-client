import { Pinecone } from '../index';

const DATA_HOST = 'egress-bytes.svc.test.pinecone.io';
const NAMESPACE = 'articles';

const json = (body: object) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

const indexClient = (fetchApi: jest.Mock) =>
  new Pinecone({ apiKey: 'mock-egress-key', fetchApi, maxRetries: 0 })
    .index({ host: `https://${DATA_HOST}` })
    .namespace(NAMESPACE);

type IndexClient = ReturnType<typeof indexClient>;

// The OpenAPI `Usage` schema returned by vector reads declares camelCase keys.
const camelUsage = (egressBytes?: number) => ({ readUnits: 3, egressBytes });
const snakeUsage = (egressBytes?: number) => ({
  read_units: 3,
  egress_bytes: egressBytes,
});

const reads = [
  {
    name: 'query',
    call: (index: IndexClient) => index.query({ topK: 1, vector: [0.1, 0.2] }),
    usage: camelUsage,
    response: { matches: [], namespace: NAMESPACE },
  },
  {
    name: 'fetch',
    call: (index: IndexClient) => index.fetch({ ids: ['v1'] }),
    usage: camelUsage,
    response: { vectors: {}, namespace: NAMESPACE },
  },
  {
    name: 'fetchByMetadata',
    call: (index: IndexClient) =>
      index.fetchByMetadata({ filter: { genre: { $eq: 'drama' } } }),
    usage: camelUsage,
    response: { vectors: {}, namespace: NAMESPACE },
  },
  {
    name: 'listPaginated',
    call: (index: IndexClient) => index.listPaginated(),
    usage: camelUsage,
    response: { vectors: [], namespace: NAMESPACE },
  },
  {
    name: 'searchRecords',
    call: (index: IndexClient) =>
      index.searchRecords({
        query: { topK: 1, inputs: { text: 'aqueducts' } },
      }),
    usage: snakeUsage,
    response: { result: { hits: [] }, namespace: NAMESPACE },
  },
  {
    name: 'documents.search',
    call: (index: IndexClient) =>
      index.documents.search({
        scoreBy: [{ type: 'text', fields: ['body'], query: 'aqueducts' }],
        topK: 1,
      }),
    usage: snakeUsage,
    response: { matches: [], namespace: NAMESPACE },
  },
  {
    name: 'documents.fetch',
    call: (index: IndexClient) => index.documents.fetch({ ids: ['d1'] }),
    usage: snakeUsage,
    response: { documents: {}, namespace: NAMESPACE },
  },
  {
    name: 'documents.list',
    call: (index: IndexClient) => index.documents.list(),
    usage: snakeUsage,
    response: { documents: [], namespace: NAMESPACE },
  },
];

describe('egress bytes wire contract', () => {
  test.each(reads)(
    '$name decodes egress bytes from usage',
    async ({ call, usage, response }) => {
      const transport = jest
        .fn()
        .mockResolvedValue(json({ ...response, usage: usage(2048) }));
      const result = await call(indexClient(transport));

      expect(result.usage).toEqual({ readUnits: 3, egressBytes: 2048 });
    },
  );

  test.each(reads)(
    '$name leaves egressBytes undefined when the server omits it',
    async ({ call, usage, response }) => {
      const transport = jest
        .fn()
        .mockResolvedValue(json({ ...response, usage: usage() }));
      const result = await call(indexClient(transport));

      expect(result.usage).toEqual({ readUnits: 3 });
      expect(result.usage?.egressBytes).toBeUndefined();
    },
  );
});
