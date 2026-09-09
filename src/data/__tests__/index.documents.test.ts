import { Index } from '../index';
import { DocumentOperationsProvider } from '../documents/documentOperationsProvider';
import { upsertDocuments } from '../documents/upsertDocuments';
import { searchDocuments } from '../documents/searchDocuments';
import { fetchDocuments } from '../documents/fetchDocuments';
import { deleteDocuments } from '../documents/deleteDocuments';
import { listDocuments } from '../documents/listDocuments';
import { updateDocuments } from '../documents/updateDocuments';
import type { DocumentOperationsApi } from '../../pinecone-generated-ts-fetch/db_data';

jest.mock('../documents/documentOperationsProvider');
jest.mock('../documents/upsertDocuments');
jest.mock('../documents/searchDocuments');
jest.mock('../documents/fetchDocuments');
jest.mock('../documents/deleteDocuments');
jest.mock('../documents/listDocuments');
jest.mock('../documents/updateDocuments');

// Keep the options and invocation typed against each public Index method.
function operation<Options, Response>(
  name: string,
  command: (
    api: DocumentOperationsApi,
    namespace: string,
    options: Options,
  ) => Promise<Response>,
  options: Options,
  invoke: (index: Index, options: Options) => Promise<Response>,
) {
  return {
    name,
    command,
    options,
    invoke: (index: Index) => invoke(index, options),
  };
}

const operations = [
  operation(
    'upsertDocuments',
    upsertDocuments,
    { documents: [{ _id: 'doc-1', text: 'Hello' }] },
    (index, options) => index.upsertDocuments(options),
  ),
  operation(
    'searchDocuments',
    searchDocuments,
    {
      scoreBy: [
        { type: 'dense_vector', fields: ['embedding'], values: [0.1, 0.2] },
      ],
      topK: 5,
    },
    (index, options) => index.searchDocuments(options),
  ),
  operation(
    'fetchDocuments',
    fetchDocuments,
    { ids: ['doc-1'] },
    (index, options) => index.fetchDocuments(options),
  ),
  operation(
    'deleteDocuments',
    deleteDocuments,
    { ids: ['doc-1'] },
    (index, options) => index.deleteDocuments(options),
  ),
  operation(
    'listDocuments',
    listDocuments,
    { limit: 10, prefix: 'doc-' },
    (index, options) => index.listDocuments(options),
  ),
  operation(
    'updateDocuments',
    updateDocuments,
    {
      documents: [
        { _id: 'doc-1', text: 'Updated', _remove_fields: ['oldText'] },
      ],
    },
    (index, options) => index.updateDocuments(options),
  ),
];

const config = { apiKey: 'test-api-key' };
const target = {
  name: 'document-index',
  host: 'https://documents.pinecone.io',
  additionalHeaders: { 'x-custom-header': 'custom-value' },
};

// The operations are mocked at the Index boundary; the sentinel ensures that
// the exact API returned by the instance's provider reaches the operation.
const api = { documentApiSentinel: true } as unknown as DocumentOperationsApi;

describe('Index document operations', () => {
  beforeEach(() => {
    jest
      .mocked(DocumentOperationsProvider.prototype.provide)
      .mockResolvedValue(api);
  });

  test('constructs the document provider with config, name, host, and headers', () => {
    new Index(target, config);

    expect(DocumentOperationsProvider).toHaveBeenCalledTimes(1);
    expect(DocumentOperationsProvider).toHaveBeenCalledWith(
      config,
      target.name,
      target.host,
      target.additionalHeaders,
    );
  });

  test('lists documents with no options through the public Index method', async () => {
    const index = new Index(target, config);
    await index.listDocuments();
    expect(listDocuments).toHaveBeenCalledWith(api, '__default__', {});
  });

  describe.each(operations)('$name', ({ command, options, invoke }) => {
    test.each([
      {
        label: 'default namespace',
        namespace: '__default__',
        create: () => new Index(target, config),
      },
      {
        label: 'namespace option',
        namespace: 'tenant-a',
        create: () => new Index({ ...target, namespace: 'tenant-a' }, config),
      },
      {
        label: 'empty namespace option',
        namespace: '__default__',
        create: () => new Index({ ...target, namespace: '' }, config),
      },
      {
        label: 'chained namespace',
        namespace: 'tenant-b',
        create: () =>
          new Index({ ...target, namespace: 'tenant-a' }, config).namespace(
            'tenant-b',
          ),
      },
      {
        label: 'repeated namespace chaining',
        namespace: 'tenant-c',
        create: () =>
          new Index(target, config).namespace('tenant-b').namespace('tenant-c'),
      },
      {
        label: 'chaining back to default',
        namespace: '__default__',
        create: () =>
          new Index({ ...target, namespace: 'tenant-a' }, config).namespace(''),
      },
    ])(
      'forwards the $label and returns the operation result',
      async ({ namespace, create }) => {
        const response = { responseSentinel: true };
        (command as jest.Mock).mockResolvedValue(response);
        const index = create();

        await expect(invoke(index)).resolves.toBe(response);

        expect(
          DocumentOperationsProvider.prototype.provide,
        ).toHaveBeenCalledTimes(1);
        expect(command).toHaveBeenCalledTimes(1);
        expect(command).toHaveBeenCalledWith(api, namespace, options);
        expect((command as jest.Mock).mock.calls[0][2]).toBe(options);
        for (const call of jest.mocked(DocumentOperationsProvider).mock.calls) {
          expect(call).toEqual([
            config,
            target.name,
            target.host,
            target.additionalHeaders,
          ]);
        }
      },
    );

    test('keeps parent and child namespaces independent', async () => {
      const parent = new Index({ ...target, namespace: 'parent' }, config);
      const child = parent.namespace('child');
      const parentApi = { parent: true } as unknown as DocumentOperationsApi;
      const childApi = { child: true } as unknown as DocumentOperationsApi;
      const providers = jest.mocked(DocumentOperationsProvider).mock.instances;
      jest.mocked(providers[0].provide).mockResolvedValue(parentApi);
      jest.mocked(providers[1].provide).mockResolvedValue(childApi);

      await invoke(child);
      await invoke(parent);

      expect(command).toHaveBeenNthCalledWith(1, childApi, 'child', options);
      expect(command).toHaveBeenNthCalledWith(2, parentApi, 'parent', options);
    });

    test('propagates provider errors without invoking the operation', async () => {
      const error = new Error('Unable to resolve document index host');
      jest
        .mocked(DocumentOperationsProvider.prototype.provide)
        .mockRejectedValue(error);

      await expect(invoke(new Index(target, config))).rejects.toBe(error);
      expect(command).not.toHaveBeenCalled();
    });
  });
});
