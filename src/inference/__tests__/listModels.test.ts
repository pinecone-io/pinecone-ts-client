import type {
  InferenceApi,
  ListModelsRequest,
  ModelInfoList,
} from '../../pinecone-generated-ts-fetch/inference';
import { listModels } from '../listModels';

const setupListModelsResponse = (response = {}, isSuccessful = true) => {
  const fakeListModels: (req: ListModelsRequest) => Promise<ModelInfoList> =
    jest
      .fn()
      .mockImplementation(() =>
        isSuccessful ? Promise.resolve(response) : Promise.reject(response)
      );

  const IA = { listModels: fakeListModels } as InferenceApi;
  return IA;
};

describe('listModels', () => {
  test('calls OpenAPI listModels with correct request', async () => {
    const IA = setupListModelsResponse();
    await listModels(IA)({ type: 'embed', vectorType: 'sparse' });
    expect(IA.listModels).toHaveBeenCalledWith({
      type: 'embed',
      vectorType: 'sparse',
    });
  });
});
