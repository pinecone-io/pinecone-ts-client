import { Index } from '../index';
import { Documents } from '../documents/documents';

interface DelegateCase {
  name: string;
  method: keyof Documents;
  invoke: (index: Index, options: never) => Promise<unknown>;
  options: unknown;
}

const delegates: DelegateCase[] = [
  {
    name: 'upsertDocuments',
    method: 'upsert',
    invoke: (index, options) => index.upsertDocuments(options),
    options: { documents: [{ _id: 'doc-1', chunk_text: 'Hello' }] },
  },
  {
    name: 'searchDocuments',
    method: 'search',
    invoke: (index, options) => index.searchDocuments(options),
    options: {
      scoreBy: [{ type: 'text', field: 'chunk_text', query: 'hello' }],
      topK: 5,
    },
  },
  {
    name: 'fetchDocuments',
    method: 'fetch',
    invoke: (index, options) => index.fetchDocuments(options),
    options: { ids: ['doc-1'] },
  },
  {
    name: 'updateDocuments',
    method: 'update',
    invoke: (index, options) => index.updateDocuments(options),
    options: { documents: [{ _id: 'doc-1', chunk_text: 'Updated' }] },
  },
  {
    name: 'listDocuments',
    method: 'list',
    invoke: (index, options) => index.listDocuments(options),
    options: { limit: 10, prefix: 'doc-' },
  },
  {
    name: 'deleteDocuments',
    method: 'delete',
    invoke: (index, options) => index.deleteDocuments(options),
    options: { ids: ['doc-1'] },
  },
];

const config = { apiKey: 'test-api-key' };
const target = {
  name: 'document-index',
  host: 'https://documents.pinecone.io',
};

describe('deprecated flat document methods', () => {
  test.each(delegates)(
    '$name forwards its argument unchanged and returns the accessor promise',
    async ({ method, invoke, options }) => {
      const index = new Index(target, config);
      const response = Promise.resolve({ responseSentinel: true });
      const accessor = jest
        .spyOn(index.documents, method)
        .mockReturnValue(response as never);
      const frozen = Object.freeze(options);

      expect(invoke(index, frozen as never)).toBe(response);

      expect(accessor).toHaveBeenCalledTimes(1);
      expect(accessor.mock.calls[0][0]).toBe(frozen);
      expect(accessor.mock.instances[0]).toBe(index.documents);
      await response;
    },
  );

  test('listDocuments called with no arguments still lists the first page', () => {
    const index = new Index(target, config);
    const list = jest
      .spyOn(index.documents, 'list')
      .mockResolvedValue(undefined as never);

    index.listDocuments();

    expect(list).toHaveBeenCalledWith({});
  });

  test('namespace() gives the new instance its own documents accessor', () => {
    const index = new Index(target, config);
    const scoped = index.namespace('tenant-a');

    expect(scoped.documents).toBeInstanceOf(Documents);
    expect(scoped.documents).not.toBe(index.documents);
    expect(index.namespace('tenant-a').documents).not.toBe(scoped.documents);
  });

  test('the accessor is built once per Index instance', () => {
    const index = new Index(target, config);

    expect(index.documents).toBe(index.documents);
  });
});
