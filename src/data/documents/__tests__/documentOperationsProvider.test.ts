import { DocumentOperationsProvider } from '../documentOperationsProvider';
import { IndexHostSingleton } from '../../indexHostSingleton';
import { DocumentOperationsApi } from '../../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../../errors';

const config = { apiKey: 'test-api-key' };

describe('DocumentOperationsProvider', () => {
  beforeEach(() => {
    jest
      .spyOn(IndexHostSingleton, 'getHostUrl')
      .mockResolvedValue('https://resolved.pinecone.io');
  });

  afterEach(() => jest.restoreAllMocks());

  test('resolves the host lazily and memoizes the generated API', async () => {
    const provider = new DocumentOperationsProvider(config, 'documents');
    expect(IndexHostSingleton.getHostUrl).not.toHaveBeenCalled();
    const api = await provider.provide();
    expect(api).toBeInstanceOf(DocumentOperationsApi);
    expect(api['configuration'].basePath).toBe('https://resolved.pinecone.io');
    expect(await provider.provide()).toBe(api);
    expect(IndexHostSingleton.getHostUrl).toHaveBeenCalledTimes(1);
    expect(IndexHostSingleton.getHostUrl).toHaveBeenCalledWith(
      config,
      'documents',
    );
  });

  test.each([
    ['documents.pinecone.io', 'https://documents.pinecone.io'],
    ['http://localhost:4000', 'http://localhost:4000'],
  ])(
    'normalizes explicit host %s without resolving an index name',
    async (host, expected) => {
      const api = await new DocumentOperationsProvider(
        config,
        undefined,
        host,
      ).provide();
      expect(api['configuration'].basePath).toBe(expected);
      expect(IndexHostSingleton.getHostUrl).not.toHaveBeenCalled();
    },
  );

  test('rejects a missing name and host before resolving a host', async () => {
    const provider = new DocumentOperationsProvider(config);
    await expect(provider.provide()).rejects.toThrow(PineconeArgumentError);
    await expect(provider.provide()).rejects.toThrow(
      'Either name or host must be provided',
    );
    expect(IndexHostSingleton.getHostUrl).not.toHaveBeenCalled();
  });

  test('preserves fetch, credentials, version, user agent, and additional headers', async () => {
    const fetchApi = jest
      .fn()
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            documents: [],
            namespace: 'tenant',
            usage: { read_units: 1 },
          }),
        ),
      );
    const api = await new DocumentOperationsProvider(
      { ...config, fetchApi },
      undefined,
      'documents.pinecone.io',
      { 'x-tenant': 'customer' },
    ).provide();
    await api.listDocuments({
      namespace: 'tenant',
      listDocumentsRequest: {},
      xPineconeApiVersion: '2026-07',
    });
    expect(fetchApi).toHaveBeenCalledWith(
      'https://documents.pinecone.io/namespaces/tenant/documents/list',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(api['configuration'].apiKey?.('Api-Key')).toBe(config.apiKey);
    expect(api['configuration'].headers).toEqual(
      expect.objectContaining({
        'X-Pinecone-Api-Version': '2026-07',
        'User-Agent': expect.any(String),
        'x-tenant': 'customer',
      }),
    );
  });

  test('retries host resolution after an initial failure', async () => {
    const error = new Error('host lookup failed');
    jest.mocked(IndexHostSingleton.getHostUrl).mockRejectedValueOnce(error);
    const provider = new DocumentOperationsProvider(config, 'documents');
    await expect(provider.provide()).rejects.toBe(error);
    expect(await provider.provide()).toBeInstanceOf(DocumentOperationsApi);
    expect(IndexHostSingleton.getHostUrl).toHaveBeenCalledTimes(2);
  });
});
