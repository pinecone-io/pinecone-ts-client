import { context } from '../context';
import {
  ContextAssistantRequest,
  ContextModel,
  ManageAssistantsApi,
} from '../../../pinecone-generated-ts-fetch/assistant_data';
import { AsstDataOperationsProvider } from '../asstDataOperationsProvider';

const setupApiProvider = () => {
  const fakeContextAssistant: (
    req: ContextAssistantRequest
  ) => Promise<ContextModel> = jest
    .fn()
    .mockImplementation(() => Promise.resolve({}));

  const MAP = {
    contextAssistant: fakeContextAssistant,
  } as ManageAssistantsApi;
  const AsstDataOperationsProvider = {
    provideData: async () => MAP,
  } as AsstDataOperationsProvider;
  return { MAP, AsstDataOperationsProvider };
};

describe('contextClosed', () => {
  let mockApi: ManageAssistantsApi;
  let asstOperationsProvider: AsstDataOperationsProvider;

  beforeEach(() => {
    const { MAP, AsstDataOperationsProvider } = setupApiProvider();
    mockApi = MAP;
    asstOperationsProvider = AsstDataOperationsProvider;
  });

  test('creates a context function that calls the API with correct parameters', async () => {
    const assistantName = 'test-assistant';
    const contextFn = context(assistantName, asstOperationsProvider);

    const options = {
      query: 'test query',
      filter: { key: 'value' },
    };

    await contextFn(options);

    expect(mockApi.contextAssistant).toHaveBeenCalledWith({
      assistantName,
      contextRequest: {
        query: options.query,
        filter: options.filter,
      },
    });
  });

  test('throws error when query is empty', async () => {
    const contextFn = context('test-assistant', asstOperationsProvider);

    await expect(contextFn({ query: '' })).rejects.toThrow(
      'Must provide a query'
    );
  });

  test('works without filter parameter', async () => {
    const assistantName = 'test-assistant';
    const contextFn = context(assistantName, asstOperationsProvider);

    const options = {
      query: 'test query',
    };

    await contextFn(options);

    expect(mockApi.contextAssistant).toHaveBeenCalledWith({
      assistantName,
      contextRequest: {
        query: options.query,
        filter: undefined,
      },
    });
  });
});
