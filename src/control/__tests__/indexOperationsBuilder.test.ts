import { indexOperationsBuilder } from '../indexOperationsBuilder';
import { Configuration } from '../../pinecone-generated-ts-fetch/db_control';

jest.mock('../../pinecone-generated-ts-fetch/db_control', () => ({
  ...jest.requireActual('../../pinecone-generated-ts-fetch/db_control'),
  Configuration: jest.fn(),
}));

describe('indexOperationsBuilder', () => {
  test('API Configuration basePath is set to api.pinecone.io by default', () => {
    const config = { apiKey: 'test-api-key' };
    indexOperationsBuilder(config);
    expect(Configuration).toHaveBeenCalledWith(
      expect.objectContaining({ basePath: 'https://api.pinecone.io' })
    );
  });

  test('controllerHostUrl overwrites the basePath in API Configuration', () => {
    const controllerHostUrl = 'https://test-controller-host-url.io';
    const config = {
      apiKey: 'test-api-key',
      controllerHostUrl,
    };
    indexOperationsBuilder(config);
    expect(Configuration).toHaveBeenCalledWith(
      expect.objectContaining({ basePath: controllerHostUrl })
    );
  });

  test('additionalHeaders are passed to the API Configuration', () => {
    const additionalHeaders = { 'x-test-header': 'test-value' };
    const config = { apiKey: 'test-api-key', additionalHeaders };
    indexOperationsBuilder(config);
    expect(Configuration).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining(additionalHeaders),
      })
    );
  });
});
