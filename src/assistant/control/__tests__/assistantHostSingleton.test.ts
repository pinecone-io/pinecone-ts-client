import { AssistantHostSingleton } from '../assistantHostSingleton';

describe('AssistantHostSingleton', () => {
  afterEach(() => {
    AssistantHostSingleton._reset();
  });

  test('returns default host URL when no region is set', () => {
    const pineconeConfig = { apiKey: 'test-key' };
    const hostUrl = AssistantHostSingleton.getHostUrl(
      pineconeConfig,
      'assistant-1'
    );
    expect(hostUrl).toEqual('https://api.pinecone.io/assistant');
  });

  test('returns correct host URL for US region', () => {
    const pineconeConfig = { apiKey: 'test-key' };
    AssistantHostSingleton._set(pineconeConfig, 'assistant-1', 'us');
    const hostUrl = AssistantHostSingleton.getHostUrl(
      pineconeConfig,
      'assistant-1'
    );
    expect(hostUrl).toEqual('https://prod-1-data.ke.pinecone.io/assistant');
  });

  test('returns correct host URL for EU region', () => {
    const pineconeConfig = { apiKey: 'test-key' };
    AssistantHostSingleton._set(pineconeConfig, 'assistant-1', 'eu');
    const hostUrl = AssistantHostSingleton.getHostUrl(
      pineconeConfig,
      'assistant-1'
    );
    expect(hostUrl).toEqual('https://prod-eu-data.ke.pinecone.io/assistant');
  });

  test('caches host URL per apiKey and assistantName combination', () => {
    const pineconeConfig1 = { apiKey: 'test-key-1' };
    const pineconeConfig2 = { apiKey: 'test-key-2' };

    AssistantHostSingleton._set(pineconeConfig1, 'assistant-1', 'us');
    AssistantHostSingleton._set(pineconeConfig2, 'assistant-1', 'eu');

    const hostUrl1 = AssistantHostSingleton.getHostUrl(
      pineconeConfig1,
      'assistant-1'
    );
    const hostUrl2 = AssistantHostSingleton.getHostUrl(
      pineconeConfig2,
      'assistant-1'
    );

    expect(hostUrl1).toEqual('https://prod-1-data.ke.pinecone.io/assistant');
    expect(hostUrl2).toEqual('https://prod-eu-data.ke.pinecone.io/assistant');
  });

  test('_delete removes cached host URL', () => {
    const pineconeConfig = { apiKey: 'test-key' };
    AssistantHostSingleton._set(pineconeConfig, 'assistant-1', 'us');

    let hostUrl = AssistantHostSingleton.getHostUrl(
      pineconeConfig,
      'assistant-1'
    );
    expect(hostUrl).toEqual('https://prod-1-data.ke.pinecone.io/assistant');

    AssistantHostSingleton._delete(pineconeConfig, 'assistant-1');
    hostUrl = AssistantHostSingleton.getHostUrl(pineconeConfig, 'assistant-1');
    expect(hostUrl).toEqual('https://api.pinecone.io/assistant');
  });

  test('_reset clears all cached host URLs', () => {
    const pineconeConfig = { apiKey: 'test-key' };
    AssistantHostSingleton._set(pineconeConfig, 'assistant-1', 'us');
    AssistantHostSingleton._set(pineconeConfig, 'assistant-2', 'eu');

    AssistantHostSingleton._reset();

    const hostUrl1 = AssistantHostSingleton.getHostUrl(
      pineconeConfig,
      'assistant-1'
    );
    const hostUrl2 = AssistantHostSingleton.getHostUrl(
      pineconeConfig,
      'assistant-2'
    );

    expect(hostUrl1).toEqual('https://api.pinecone.io/assistant');
    expect(hostUrl2).toEqual('https://api.pinecone.io/assistant');
  });

  test('_set does not cache empty hostUrl values', () => {
    const pineconeConfig = { apiKey: 'test-key' };
    AssistantHostSingleton._set(pineconeConfig, 'assistant-1', '');

    const hostUrl = AssistantHostSingleton.getHostUrl(
      pineconeConfig,
      'assistant-1'
    );
    expect(hostUrl).toEqual('https://api.pinecone.io/assistant');
  });

  test('returns same host URL instance for same apiKey and assistantName combination', () => {
    const pineconeConfig = { apiKey: 'test-key' };
    AssistantHostSingleton._set(pineconeConfig, 'assistant-1', 'us');

    const hostUrl1 = AssistantHostSingleton.getHostUrl(
      pineconeConfig,
      'assistant-1'
    );
    const hostUrl2 = AssistantHostSingleton.getHostUrl(
      pineconeConfig,
      'assistant-1'
    );

    expect(hostUrl1).toBe(hostUrl2); // Using .toBe() to check instance equality
    expect(hostUrl1).toEqual('https://prod-1-data.ke.pinecone.io/assistant');
  });

  test('creates different host URL instances for different apiKeys', () => {
    const pineconeConfig1 = { apiKey: 'test-key-1' };
    const pineconeConfig2 = { apiKey: 'test-key-2' };

    AssistantHostSingleton._set(pineconeConfig1, 'assistant-1', 'us');
    AssistantHostSingleton._set(pineconeConfig2, 'assistant-1', 'eu');

    const hostUrl1 = AssistantHostSingleton.getHostUrl(
      pineconeConfig1,
      'assistant-1'
    );
    const hostUrl2 = AssistantHostSingleton.getHostUrl(
      pineconeConfig2,
      'assistant-1'
    );

    expect(hostUrl1).not.toBe(hostUrl2);
    expect(hostUrl1).toEqual('https://prod-1-data.ke.pinecone.io/assistant');
    expect(hostUrl2).toEqual('https://prod-eu-data.ke.pinecone.io/assistant');
  });

  test('creates different host URL instances for different assistant names', () => {
    const pineconeConfig = { apiKey: 'test-key' };

    AssistantHostSingleton._set(pineconeConfig, 'assistant-1', 'us');
    AssistantHostSingleton._set(pineconeConfig, 'assistant-2', 'eu');

    const hostUrl1 = AssistantHostSingleton.getHostUrl(
      pineconeConfig,
      'assistant-1'
    );
    const hostUrl2 = AssistantHostSingleton.getHostUrl(
      pineconeConfig,
      'assistant-2'
    );

    expect(hostUrl1).not.toBe(hostUrl2);
    expect(hostUrl1).toEqual('https://prod-1-data.ke.pinecone.io/assistant');
    expect(hostUrl2).toEqual('https://prod-eu-data.ke.pinecone.io/assistant');
  });
});
