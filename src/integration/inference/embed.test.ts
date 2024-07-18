import { Pinecone } from '../../pinecone';
import { EmbeddingsList } from '../../models';

describe('Integration Test: Pinecone Inference API embeddings endpoint', () => {
  let inputs: Array<string>;
  let params: Record<string, string>;
  let model: string;
  let pinecone: Pinecone;

  beforeAll(() => {
    inputs = ['hello', 'world'];
    params = {
      inputType: 'passage',
      truncate: 'END',
    };
    model = 'multilingual-e5-large';
    const apiKey = process.env.PINECONE_API_KEY || '';
    pinecone = new Pinecone({ apiKey });
  });

  it('Confirm output types', async () => {
    const response = await pinecone.inference.embed(model, inputs, params);
    const responseAsArray = response as EmbeddingsList;
    expect(responseAsArray.length).toBe(inputs.length);
    expect(response instanceof EmbeddingsList).toBe(true);
    expect(response.model).toBeDefined();
    expect(response.data).toBeDefined();
    expect(response.usage).toBeDefined();
  });
});
