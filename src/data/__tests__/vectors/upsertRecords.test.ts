import { UpsertRecordsCommand } from '../../vectors/upsertRecords';
import { VectorOperationsProvider } from '../../vectors/vectorOperationsProvider';
import { PineconeArgumentError } from '../../../errors';
import { PineconeConfiguration, IntegratedRecord } from '../../vectors/types';

let mockFetch: jest.Mock;
const mockHostUrl = 'https://host-url.io';
const mockNamepspace = 'mock-namespace';

const setupCmd = (response: object) => {
  mockFetch = jest.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => response,
    text: async () => JSON.stringify(response),
  });
  const VectorProvider = {
    provideHostUrl: async () => mockHostUrl,
  } as VectorOperationsProvider;

  const config = {
    apiKey: 'api-key-test',
    fetchApi: mockFetch,
  } as PineconeConfiguration;

  const cmd = new UpsertRecordsCommand(VectorProvider, mockNamepspace, config);

  return { cmd, mockFetch };
};

describe('upsertRecords', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls fetch with the upsert records endpoint', async () => {
    const { cmd, mockFetch } = setupCmd({});
    const records = [
      { id: '1', chunk_text: 'test', category: 'test' },
      { id: '2', chunk_text: 'test2', category: 'test' },
    ];

    await cmd.run({ records });
    expect(mockFetch).toHaveBeenCalledWith(
      `${mockHostUrl}/records/namespaces/${mockNamepspace}/upsert`,
      expect.objectContaining({
        method: 'POST',
      }),
    );
  });

  test('converts records to ndjson string', async () => {
    const { cmd, mockFetch } = setupCmd({});
    const records = [
      { id: '1', chunk_text: 'test', category: 'test' },
      { id: '2', chunk_text: 'test2', category: 'test' },
    ];

    await cmd.run({ records });
    expect(mockFetch).toHaveBeenCalledWith(
      `${mockHostUrl}/records/namespaces/${mockNamepspace}/upsert`,
      expect.objectContaining({
        body: records.map((record) => JSON.stringify(record)).join('\n'),
      }),
    );
  });

  test('throws PineconeArgumentError if no _id or id is provided with record', async () => {
    const { cmd } = setupCmd({});
    const records: Array<IntegratedRecord> = [
      // @ts-ignore
      { chunk_text: 'test', category: 'test' },
      // @ts-ignore
      { chunk_text: 'test2', category: 'test' },
    ];

    try {
      await cmd.run({ records });
    } catch (err) {
      expect(err).toBeInstanceOf(PineconeArgumentError);
      expect((err as PineconeArgumentError).message).toContain(
        'Every record must include an `id` or `_id` property in order to upsert.',
      );
    }
  });
});

describe('upsertRecords path safety', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test.each(['.', '..'])(
    'a namespace of %p is refused before the request goes out',
    async (namespace) => {
      const { cmd, mockFetch } = setupCmd({});
      await expect(
        cmd.run({ records: [{ id: '1', chunk_text: 'test' }], namespace }),
      ).rejects.toThrow(PineconeArgumentError);
      expect(mockFetch).not.toHaveBeenCalled();
    },
  );

  test.each([
    ['ns-1', 'ns-1'],
    ['a/b', 'a%2Fb'],
    ['a.b', 'a.b'],
    ['%2e%2e', '%252e%252e'],
  ])('a namespace of %p reaches %p', async (namespace, encoded) => {
    const { cmd, mockFetch } = setupCmd({});
    await cmd.run({ records: [{ id: '1', chunk_text: 'test' }], namespace });
    expect(new URL(mockFetch.mock.calls[0][0]).pathname).toBe(
      `/records/namespaces/${encoded}/upsert`,
    );
  });
});
