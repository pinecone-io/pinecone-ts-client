import type {
  InferenceApi,
  EmbeddingsList,
  EmbedOperationRequest,
} from '../../pinecone-generated-ts-fetch/inference';
import { embed } from '../embed';

const setupEmbedResponse = (isSuccess) => {
  const fakeEmbed: (req: EmbedOperationRequest) => Promise<EmbeddingsList> =
    jest
      .fn()
      .mockImplementation(() =>
        isSuccess ? Promise.resolve({}) : Promise.reject({}),
      );
  const IA = { embed: fakeEmbed } as InferenceApi;
  return IA;
};

describe('embed', () => {
  test('should format inputs correctly', async () => {
    const model = 'test-model';
    const inputs = ['input1', 'input2'];
    const expectedInputs = [{ text: 'input1' }, { text: 'input2' }];
    const params = { inputType: 'text', truncate: 'END' };

    const IA = setupEmbedResponse(true);
    await embed(IA)(model, inputs, params);
    expect(IA.embed).toHaveBeenCalledWith(
      expect.objectContaining({
        embedRequest: expect.objectContaining({ inputs: expectedInputs }),
      }),
    );
  });
});
