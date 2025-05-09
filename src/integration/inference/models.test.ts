import { Pinecone } from '../../pinecone';

describe('inference models', () => {
  let pinecone: Pinecone;

  beforeAll(() => {
    const apiKey = process.env.PINECONE_API_KEY || '';
    pinecone = new Pinecone({ apiKey });
  });

  test('get model', async () => {
    const model = await pinecone.inference.getModel('multilingual-e5-large');
    expect(model).toBeDefined();
    expect(model.name).toEqual('multilingual-e5-large');
  });

  test('list models', async () => {
    const modelList = await pinecone.inference.listModels();
    expect(modelList).toBeDefined();
    expect(modelList.models).toBeGreaterThan(0);
  });
});
