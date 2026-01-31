import type {
  InferenceApi,
  GetModelRequest,
  ModelInfo,
} from '../../pinecone-generated-ts-fetch/inference';
import { getModel } from '../getModel';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/inference/api_version';

const setupGetModelResponse = (response = {}, isSuccessful = true) => {
  const fakeGetModel: (req: GetModelRequest) => Promise<ModelInfo> = jest
    .fn()
    .mockImplementation(() =>
      isSuccessful ? Promise.resolve(response) : Promise.reject(response),
    );

  const IA = { getModel: fakeGetModel } as InferenceApi;
  return IA;
};

describe('getModel', () => {
  test('Confirm throws error if no model name is passed', async () => {
    const IA = setupGetModelResponse();
    const getModelCmd = getModel(IA);
    await expect(getModelCmd('')).rejects.toThrow(
      new Error(
        'You must pass a non-empty string for `modelName` in order to get a model',
      ),
    );
  });

  test('calls OpenAPI getModel with correct request', async () => {
    const modelName = 'test-model';
    const IA = setupGetModelResponse();
    await getModel(IA)(modelName);
    expect(IA.getModel).toHaveBeenCalledWith({
      modelName,
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });
});
