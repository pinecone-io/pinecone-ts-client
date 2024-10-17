import { Inference } from '../inference';
import type { PineconeConfiguration } from '../../data';
import { inferenceOperationsBuilder } from '../inferenceOperationsBuilder';

let inference: Inference;

beforeAll(() => {
  const config: PineconeConfiguration = { apiKey: 'test-api-key' };
  const infApi = inferenceOperationsBuilder(config);
  inference = new Inference(infApi);
});

describe('Inference Class: _formatInputs', () => {
  test('Should format inputs correctly', () => {
    const inputs = ['input1', 'input2'];
    const expected = [{ text: 'input1' }, { text: 'input2' }];
    const result = inference._formatInputs(inputs);
    expect(result).toEqual(expected);
  });
});

describe('Inference Class: embed', () => {
  test('Should throw error if response is missing required fields', async () => {
    const model = 'test-model';
    const inputs = ['input1', 'input2'];
    const params = { inputType: 'text', truncate: 'END' };

    const mockedIncorrectResponse = { model: 'test-model' };
    const expectedError = Error(
      'Response from Inference API is missing required fields'
    );
    const embed = jest.spyOn(inference._inferenceApi, 'embed');
    // @ts-ignore
    embed.mockResolvedValue(mockedIncorrectResponse);

    try {
      await inference.embed(model, inputs, params);
    } catch (error) {
      expect(error).toEqual(expectedError);
    }
  });
});
