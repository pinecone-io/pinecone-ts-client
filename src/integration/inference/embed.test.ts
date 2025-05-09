import { Pinecone } from '../../pinecone';

describe('Integration Test: Pinecone Inference API embeddings endpoint', () => {
  let inputs: Array<string>;
  let params: Record<string, string>;
  let model: string;
  let pinecone: Pinecone;

  beforeAll(() => {
    inputs = ['hello', 'world'];
    params = {
      input_type: 'passage',
      truncate: 'END',
    };
    model = 'multilingual-e5-large';
    const apiKey = process.env.PINECONE_API_KEY || '';
    pinecone = new Pinecone({ apiKey });
  });

  test('Confirm output types', async () => {
    const response = await pinecone.inference.embed({ model, inputs, params });
    expect(response.model).toBeDefined();
    expect(response.data).toBeDefined();
    expect(response.usage).toBeDefined();
  });
});
