import { Pinecone } from '../../pinecone';
import { SearchRecordsResponse } from '../../pinecone-generated-ts-fetch/db_data';
import { assertWithRetries, randomName } from '../test-helpers';

describe('Integrated Inference API tests', () => {
  let pinecone: Pinecone;
  let indexName: string;
  beforeAll(async () => {
    pinecone = new Pinecone();
    indexName = randomName('int-inf');

    // create integrated inference index for testing
    await pinecone.createIndexForModel({
      name: indexName,
      cloud: 'aws',
      region: 'us-east-1',
      embed: {
        model: 'multilingual-e5-large',
        fieldMap: { text: 'chunk_text' },
      },
      waitUntilReady: true,
    });
  });

  afterAll(async () => {
    await pinecone.deleteIndex(indexName);
  });

  test('test upserting and searching records', async () => {
    const upsertRecords = [
      {
        id: 'rec1',
        chunk_text:
          "Apple's first product, the Apple I, was released in 1976 and was hand-built by co-founder Steve Wozniak.",
        category: 'product',
      },
      {
        id: 'rec2',
        chunk_text:
          'Apples are a great source of dietary fiber, which supports digestion and helps maintain a healthy gut.',
        category: 'nutrition',
      },
      {
        id: 'rec3',
        chunk_text:
          'Apples originated in Central Asia and have been cultivated for thousands of years, with over 7,500 varieties available today.',
        category: 'cultivation',
      },
      {
        id: 'rec4',
        chunk_text:
          'In 2001, Apple released the iPod, which transformed the music industry by making portable music widely accessible.',
        category: 'product',
      },
      {
        id: 'rec5',
        chunk_text:
          'Apple went public in 1980, making history with one of the largest IPOs at that time.',
        category: 'milestone',
      },
      {
        id: 'rec6',
        chunk_text:
          'Rich in vitamin C and other antioxidants, apples contribute to immune health and may reduce the risk of chronic diseases.',
        category: 'nutrition',
      },
      {
        id: 'rec7',
        chunk_text:
          "Known for its design-forward products, Apple's branding and market strategy have greatly influenced the technology sector and popularized minimalist design worldwide.",
        category: 'influence',
      },
      {
        id: 'rec8',
        chunk_text:
          'The high fiber content in apples can also help regulate blood sugar levels, making them a favorable snack for people with diabetes.',
        category: 'nutrition',
      },
    ];

    await pinecone
      .index({ name: indexName })
      .upsertRecords({ records: upsertRecords });

    // Wait for records to become available using polling instead of fixed wait
    await assertWithRetries(
      () => pinecone.index({ name: indexName }).describeIndexStats(),
      (stats) => {
        expect(stats.totalRecordCount).toBeGreaterThanOrEqual(8);
      },
      30000, // max wait 30s
      2000, // check every 2s instead of waiting fixed 25s
    );

    await assertWithRetries(
      () =>
        pinecone.index({ name: indexName }).searchRecords({
          query: { topK: 3, inputs: { text: 'apple corporation' } },
        }),
      (results: SearchRecordsResponse) => {
        expect(results.result.hits).toBeDefined();
        expect(results.result.hits.length).toEqual(3);
      },
    );
  });
});
