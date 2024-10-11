import { Pinecone } from '../../pinecone';
import { PineconeArgumentError } from '../../errors';

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

  test('Confirm error thrown if custom rankField is not in docs', async () => {
    const rerankingModel = 'test-model';
    const myQuery = 'test-query';
    const myDocuments = [{ someField: 'doc1' }, { someField: 'doc2' }];
    const rerankFields = ['customField'];

    const expectedError = new PineconeArgumentError(
      'One or more documents are missing the specified rank field: customField'
    );
    try {
      await pinecone.inference.rerank(rerankingModel, myQuery, myDocuments, {
        rankFields: rerankFields,
      });
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });
});
