import { ApiKeysNamespace } from '../apiKeys';
import {
  type APIKeysApi,
  X_PINECONE_API_VERSION,
} from '../../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../../errors';

const setup = () => {
  const api = {
    createApiKey: jest.fn().mockResolvedValue({ key: {}, value: 'secret' }),
    fetchApiKey: jest.fn().mockResolvedValue({ id: 'k-1' }),
    listProjectApiKeys: jest.fn().mockResolvedValue({ data: [] }),
    updateApiKey: jest.fn().mockResolvedValue({ id: 'k-1' }),
    deleteApiKey: jest.fn().mockResolvedValue(undefined),
  } as unknown as APIKeysApi;
  return { api, apiKeys: new ApiKeysNamespace(api) };
};

describe('ApiKeysNamespace', () => {
  test('create passes projectId and body through', async () => {
    const { api, apiKeys } = setup();
    await apiKeys.create('proj-1', {
      name: 'my-key',
      roles: ['ProjectEditor'],
    });
    expect(api.createApiKey).toHaveBeenCalledWith({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      projectId: 'proj-1',
      createAPIKeyRequest: {
        name: 'my-key',
        roles: ['ProjectEditor'],
      },
    });
  });

  test('create throws when projectId is missing', async () => {
    const { apiKeys } = setup();
    await expect(apiKeys.create('', { name: 'my-key' })).rejects.toThrow(
      PineconeArgumentError,
    );
  });

  test('create throws when name is missing', async () => {
    const { apiKeys } = setup();
    await expect(apiKeys.create('proj-1', {} as never)).rejects.toThrow(
      PineconeArgumentError,
    );
  });

  test('list passes the projectId through', async () => {
    const { api, apiKeys } = setup();
    await apiKeys.list('proj-2');
    expect(api.listProjectApiKeys).toHaveBeenCalledWith({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      projectId: 'proj-2',
    });
  });

  test('list throws when projectId is empty', async () => {
    const { apiKeys } = setup();
    await expect(apiKeys.list('')).rejects.toThrow(PineconeArgumentError);
  });

  test('describe/update/delete address the key by apiKeyId', async () => {
    const { api, apiKeys } = setup();
    await apiKeys.describe('k-9');
    await apiKeys.update('k-9', { name: 'renamed' });
    await apiKeys.delete('k-9');
    expect(api.fetchApiKey).toHaveBeenCalledWith({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      apiKeyId: 'k-9',
    });
    expect(api.updateApiKey).toHaveBeenCalledWith({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      apiKeyId: 'k-9',
      updateAPIKeyRequest: { name: 'renamed', roles: undefined },
    });
    expect(api.deleteApiKey).toHaveBeenCalledWith({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      apiKeyId: 'k-9',
    });
  });
});
