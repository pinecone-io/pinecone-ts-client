import { contextClosed } from '../context';
import { ManageAssistantsApi } from '../../../pinecone-generated-ts-fetch/assistant_data';

describe('contextClosed', () => {
  let mockApi: ManageAssistantsApi;

  beforeEach(() => {
    mockApi = {
      contextAssistant: jest.fn(),
    } as unknown as ManageAssistantsApi;
  });

  test('creates a context function that calls the API with correct parameters', async () => {
    const assistantName = 'test-assistant';
    const contextFn = contextClosed(assistantName, mockApi);

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
    const contextFn = contextClosed('test-assistant', mockApi);

    await expect(contextFn({ query: '' })).rejects.toThrow(
      'Must provide a query'
    );
  });

  test('works without filter parameter', async () => {
    const assistantName = 'test-assistant';
    const contextFn = contextClosed(assistantName, mockApi);

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
