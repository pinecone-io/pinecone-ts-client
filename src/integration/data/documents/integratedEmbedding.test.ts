import { PineconeBadRequestError } from '../../../errors';
import {
  Pinecone,
  Index,
  DocumentScoringMethod,
  SearchDocumentsResponse,
} from '../../../index';
import {
  assertWithRetries,
  randomName,
  retryDeletes,
} from '../../test-helpers';

const DENSE_MODEL = 'multilingual-e5-large';

const documents = [
  {
    _id: 'd1',
    body: 'the quick brown fox jumps over the lazy dog',
    summary: 'fox and dog',
    genre: 'animal',
  },
  {
    _id: 'd2',
    body: 'pinecone serverless vector database',
    summary: 'vector database',
    genre: 'tech',
  },
  {
    _id: 'd3',
    body: 'a slow grey wolf sleeps under the old oak tree',
    summary: 'grey wolf under an oak tree',
    genre: 'animal',
  },
  {
    _id: 'd4',
    body: 'managed vector search service for developers',
    summary: 'search service',
    genre: 'tech',
  },
];

describe('integrated embedding on a document index', () => {
  const pc = new Pinecone();
  const name = randomName('documents-embed');
  const namespace = 'embed';
  let index: Index;

  const topHit = (scoreBy: DocumentScoringMethod, expected: string) =>
    assertWithRetries(
      () =>
        index.documents.search({
          scoreBy: [scoreBy],
          topK: 4,
          includeFields: ['genre'],
        }),
      (result: SearchDocumentsResponse) => {
        expect(result.matches[0]?._id).toBe(expected);
      },
    );

  beforeAll(async () => {
    await pc.indexes.create({
      name,
      deployment: {
        deploymentType: 'managed',
        cloud: 'aws',
        region: 'us-west-2',
      },
      schema: {
        fields: {
          body: { type: 'string', embed: { model: DENSE_MODEL } },
          summary: { type: 'string', sparseEmbed: {}, storeText: false },
        },
      },
      waitUntilReady: true,
      timeout: 300_000,
    });
    index = pc.index({ name, namespace });
    await index.documents.upsert({ documents });
  }, 600_000);

  afterAll(async () => {
    await retryDeletes(pc, name);
  });

  test('describe reports the resolved embedding configuration', async () => {
    const described = await pc.indexes.describe(name);
    const { body, summary } = described.schema.fields;

    expect(body).toMatchObject({
      type: 'string',
      storeText: true,
      embed: { model: DENSE_MODEL, metric: expect.any(String) },
    });
    if (!('type' in body) || body.type !== 'string') {
      throw new Error('expected body to be a string field');
    }
    expect(body.embed?.dimension).toBeGreaterThan(0);
    expect(body.embed?.writeParameters).toBeDefined();
    expect(body.embed?.readParameters).toBeDefined();
    expect(body.sparseEmbed).toBeUndefined();
    expect(body.fullTextSearch).toBeDefined();

    expect(summary).toMatchObject({
      type: 'string',
      storeText: false,
      sparseEmbed: { model: expect.any(String) },
    });
    if (!('type' in summary) || summary.type !== 'string') {
      throw new Error('expected summary to be a string field');
    }
    expect(summary.embed).toBeUndefined();
    expect(summary.fullTextSearch).toBeUndefined();
  });

  test('an embed clause ranks the closest document first', async () => {
    await topHit(
      { type: 'embed', field: 'body', query: 'a fox leaping over a dog' },
      'd1',
    );
  });

  test('a sparse_embed clause ranks the closest document first', async () => {
    await topHit(
      { type: 'sparse_embed', field: 'summary', query: 'grey wolf oak tree' },
      'd3',
    );
  });

  test('a text clause searches the stored text of an embedded field', async () => {
    await topHit({ type: 'text', fields: ['body'], query: 'serverless' }, 'd2');
  });

  test('naming an unstored field in includeFields is rejected', async () => {
    const fetched = index.documents.fetch({
      ids: ['d1'],
      includeFields: ['summary'],
    });
    await expect(fetched).rejects.toBeInstanceOf(PineconeBadRequestError);
    await expect(fetched).rejects.toThrow(/store_text/);
  });
});
