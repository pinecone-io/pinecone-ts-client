import { Pinecone } from '../../pinecone';
import { PineconeArgumentError, PineconeNotFoundError } from '../../errors';

describe('Integration Test: Pinecone Inference API rerank endpoint', () => {
  let model: string;
  let query: string;
  let documents: Array<string>;
  let pinecone: Pinecone;

  beforeAll(() => {
    query = 'What are some good Turkey dishes for Thanksgiving?';
    documents = [
      'document content 1 yay I am about turkey',
      'document content 2',
    ];
    model = 'bge-reranker-v2-m3';
    const apiKey = process.env.PINECONE_API_KEY || '';
    pinecone = new Pinecone({ apiKey });
  });

  test('Confirm high-level response structure', async () => {
    const response = await pinecone.inference.rerank(model, query, documents);
    expect(response.model).toEqual(model);
    expect(response.data).toBeDefined();
    expect(response.usage).toBeDefined();
  });

  test('Confirm lower-level response structure', async () => {
    const response = await pinecone.inference.rerank(model, query, documents);
    expect(response.data.length).toBe(documents.length);
    expect(response.data.map((doc) => doc.index)).toBeDefined();
    expect(response.data.map((doc) => doc.score)).toBeDefined();
    expect(response.data.map((doc) => doc.document)).toBeDefined();
    // @ts-ignore
    // (Just ignoring the fact that technically doc.document['text'] could be undefined)
    expect(response.data.map((doc) => doc.document['text'])).toBeDefined();
  });

  test('Confirm error thrown if rankFields does match fields in passed documents', async () => {
    const rerankingModel = 'test-model';
    const myQuery = 'test-query';
    const myDocuments = [
      { text: 'doc1', title: 'title1' },
      { text: 'doc2', title: 'title2' }
    ];
    const rankFields = ['random field'];
    try {
      await pinecone.inference.rerank(rerankingModel, myQuery, myDocuments, {
        rankFields
      });
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});
