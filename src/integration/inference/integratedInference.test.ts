import { Pinecone } from '../../pinecone';
import { SearchRecordsResponse } from '../../pinecone-generated-ts-fetch/db_data';
import { assertWithRetries, randomName } from '../test-helpers';

// Integrated-inference indexes are served by the records API, not the
// documents API: the server answers `upsertDocuments` on one of these with
// "This index is not served by the documents API ... use the records API".
const integratedNamespace = 'int-inf-ns';

describe('Integrated Inference API tests', () => {
  let pinecone: Pinecone;
  let indexName: string;
  beforeAll(async () => {
    pinecone = new Pinecone();
    indexName = randomName('int-inf');

    // create integrated inference index for testing
    await pinecone.indexes.createForModel({
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
    await pinecone.indexes.delete(indexName);
  });

  test('test upserting and searching records', async () => {
    const records = [
      {
        _id: 'rec1',
        chunk_text:
          "Apple's first product, the Apple I, was released in 1976 and was hand-built by co-founder Steve Wozniak.",
        category: 'product',
      },
      {
        _id: 'rec2',
        chunk_text:
          'Apples are a great source of dietary fiber, which supports digestion and helps maintain a healthy gut.',
        category: 'nutrition',
      },
      {
        _id: 'rec3',
        chunk_text:
          'Apples originated in Central Asia and have been cultivated for thousands of years, with over 7,500 varieties available today.',
        category: 'cultivation',
      },
      {
        _id: 'rec4',
        chunk_text:
          'In 2001, Apple released the iPod, which transformed the music industry by making portable music widely accessible.',
        category: 'product',
      },
      {
        _id: 'rec5',
        chunk_text:
          'Apple went public in 1980, making history with one of the largest IPOs at that time.',
        category: 'milestone',
      },
      {
        _id: 'rec6',
        chunk_text:
          'Rich in vitamin C and other antioxidants, apples contribute to immune health and may reduce the risk of chronic diseases.',
        category: 'nutrition',
      },
      {
        _id: 'rec7',
        chunk_text:
          "Known for its design-forward products, Apple's branding and market strategy have greatly influenced the technology sector and popularized minimalist design worldwide.",
        category: 'influence',
      },
      {
        _id: 'rec8',
        chunk_text:
          'The high fiber content in apples can also help regulate blood sugar levels, making them a favorable snack for people with diabetes.',
        category: 'nutrition',
      },
    ];

    const index = pinecone.index({
      name: indexName,
      namespace: integratedNamespace,
    });

    await index.upsertRecords({ records });

    // The server embeds each record's `chunk_text` on write, so readiness lags
    // the upsert by more than a plain vector write would.
    await assertWithRetries(
      () => index.describeIndexStats(),
      (stats) => {
        expect(stats.totalRecordCount).toBeGreaterThanOrEqual(records.length);
      },
      60000,
      2000,
    );

    // Searching by text is the whole point of integrated inference: the query
    // is embedded server-side with the field's model, so no vector is sent.
    await assertWithRetries(
      () =>
        index.searchRecords({
          query: { topK: 3, inputs: { text: 'apple corporation' } },
          fields: ['chunk_text', 'category'],
        }),
      (results: SearchRecordsResponse) => {
        expect(results.result.hits.length).toEqual(3);
        results.result.hits.forEach((hit) => {
          expect(hit._id).toBeDefined();
          expect(hit.fields).toHaveProperty('chunk_text');
        });
      },
    );
  });
});
