import { Pinecone } from '../index';

const CONTROL_PLANE = 'https://api.test.pinecone.io';
const INDEX_NAME = 'embedded-documents';
const DATA_HOST = 'embedded-documents.svc.test.pinecone.io';
const NAMESPACE = 'articles';

const describeBody = {
  name: INDEX_NAME,
  host: DATA_HOST,
  deployment: { deployment_type: 'managed', cloud: 'aws', region: 'us-east-1' },
  schema: {
    fields: {
      body: {
        type: 'string',
        full_text_search: {
          language: 'en',
          stemming: false,
          stop_words: false,
        },
        store_text: true,
        embed: {
          model: 'llama-text-embed-v2',
          dimension: 1024,
          metric: 'cosine',
          write_parameters: { input_type: 'passage', truncate: 'END' },
          read_parameters: { input_type: 'query', truncate: 'END' },
        },
        sparse_embed: {
          model: 'pinecone-sparse-english-v0',
          write_parameters: { input_type: 'passage' },
          read_parameters: { input_type: 'query' },
        },
      },
      summary: {
        type: 'string',
        store_text: false,
        embed: {
          model: 'multilingual-e5-large',
          dimension: 1024,
          metric: 'cosine',
        },
      },
    },
  },
  deletion_protection: 'disabled',
  read_capacity: { mode: 'OnDemand', status: { state: 'Ready' } },
  status: { ready: true, state: 'Ready' },
};

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const controlClient = (fetchApi: jest.Mock) =>
  new Pinecone({
    apiKey: 'mock-embed-key',
    controllerHostUrl: CONTROL_PLANE,
    fetchApi,
    maxRetries: 0,
  });

const documentsClient = (fetchApi: jest.Mock) =>
  new Pinecone({ apiKey: 'mock-embed-key', fetchApi, maxRetries: 0 })
    .index({ host: `https://${DATA_HOST}` })
    .namespace(NAMESPACE).documents;

const sentBody = (transport: jest.Mock) =>
  JSON.parse(transport.mock.calls[0][1].body);

describe('integrated embedding wire contract', () => {
  test('create sends embed, sparse_embed, and store_text with model parameters untouched', async () => {
    const transport = jest.fn().mockResolvedValue(json(describeBody, 201));
    await controlClient(transport).indexes.create({
      name: INDEX_NAME,
      schema: {
        fields: {
          body: {
            type: 'string',
            fullTextSearch: {},
            embed: {
              model: 'llama-text-embed-v2',
              dimension: 1024,
              metric: 'cosine',
              writeParameters: { input_type: 'passage', truncate: 'END' },
              readParameters: { input_type: 'query' },
            },
            sparseEmbed: {},
          },
          summary: { type: 'string', embed: {}, storeText: false },
        },
      },
    });

    expect(transport.mock.calls[0][0]).toBe(`${CONTROL_PLANE}/indexes`);
    expect(sentBody(transport)).toEqual({
      name: INDEX_NAME,
      schema: {
        fields: {
          body: {
            type: 'string',
            full_text_search: {},
            embed: {
              model: 'llama-text-embed-v2',
              dimension: 1024,
              metric: 'cosine',
              write_parameters: { input_type: 'passage', truncate: 'END' },
              read_parameters: { input_type: 'query' },
            },
            sparse_embed: {},
          },
          summary: { type: 'string', embed: {}, store_text: false },
        },
      },
    });
  });

  test('describe decodes the resolved embedding configuration', async () => {
    const transport = jest.fn().mockResolvedValue(json(describeBody));
    const index = await controlClient(transport).indexes.describe(INDEX_NAME);

    expect(index.schema.fields).toEqual({
      body: {
        type: 'string',
        fullTextSearch: { language: 'en', stemming: false, stopWords: false },
        storeText: true,
        embed: {
          model: 'llama-text-embed-v2',
          dimension: 1024,
          metric: 'cosine',
          writeParameters: { input_type: 'passage', truncate: 'END' },
          readParameters: { input_type: 'query', truncate: 'END' },
        },
        sparseEmbed: {
          model: 'pinecone-sparse-english-v0',
          writeParameters: { input_type: 'passage' },
          readParameters: { input_type: 'query' },
        },
      },
      summary: {
        type: 'string',
        storeText: false,
        embed: {
          model: 'multilingual-e5-large',
          dimension: 1024,
          metric: 'cosine',
        },
      },
    });
  });

  test.each([
    ['embed', 'trail running shoes'],
    ['sparse_embed', 'waterproof'],
  ])(
    'search sends a %s clause and decodes embed_total_tokens',
    async (type, query) => {
      const transport = jest.fn().mockResolvedValue(
        json({
          matches: [{ _id: 'doc-1', _score: 0.82 }],
          namespace: NAMESPACE,
          usage: { read_units: 6, embed_total_tokens: 4 },
        }),
      );
      const result = await documentsClient(transport).search({
        scoreBy: [{ type, field: 'body', query }],
        topK: 3,
      });

      expect(transport.mock.calls[0][0]).toBe(
        `https://${DATA_HOST}/namespaces/${NAMESPACE}/documents/search`,
      );
      expect(sentBody(transport)).toEqual({
        score_by: [{ type, field: 'body', query }],
        top_k: 3,
      });
      expect(result.usage).toEqual({ readUnits: 6, embedTotalTokens: 4 });
    },
  );

  test('search leaves embedTotalTokens undefined when the server omits it', async () => {
    const transport = jest.fn().mockResolvedValue(
      json({
        matches: [],
        namespace: NAMESPACE,
        usage: { read_units: 1 },
      }),
    );
    const result = await documentsClient(transport).search({
      scoreBy: [{ type: 'embed', field: 'body', query: 'anything' }],
      topK: 1,
    });

    expect(result.usage.embedTotalTokens).toBeUndefined();
  });

  const writes = [
    {
      name: 'upsert',
      call: (documents: ReturnType<typeof documentsClient>) =>
        documents.upsert({
          documents: [{ _id: 'd1', body: 'Roman aqueducts' }],
        }),
      response: { upserted_count: 1 },
      expected: { upsertedCount: 1 },
    },
    {
      name: 'update',
      call: (documents: ReturnType<typeof documentsClient>) =>
        documents.update({ documents: [{ _id: 'd1', body: 'Roman roads' }] }),
      response: { matched_records: 1 },
      expected: { matchedRecords: 1 },
    },
  ];

  test.each(writes)(
    '$name decodes usage.embed_total_tokens',
    async ({ call, response, expected }) => {
      const transport = jest
        .fn()
        .mockResolvedValue(
          json({ ...response, usage: { embed_total_tokens: 5 } }),
        );

      await expect(call(documentsClient(transport))).resolves.toEqual({
        ...expected,
        usage: { embedTotalTokens: 5 },
      });
    },
  );

  test.each(writes)(
    '$name leaves usage undefined when the server omits it',
    async ({ call, response, expected }) => {
      const transport = jest.fn().mockResolvedValue(json(response));
      const result = await call(documentsClient(transport));

      expect(result).toEqual(expected);
      expect(result.usage).toBeUndefined();
    },
  );
});
