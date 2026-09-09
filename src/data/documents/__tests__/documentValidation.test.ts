import { updateDocuments } from '../updateDocuments';
import type { DocumentOperationsApi } from '../../../pinecone-generated-ts-fetch/db_data';

describe('updateDocuments argument validation', () => {
  const fakeUpdate: (req: object) => Promise<object> = jest
    .fn()
    .mockImplementation(() => Promise.resolve({}));
  const api = { updateDocuments: fakeUpdate } as DocumentOperationsApi;

  beforeEach(() => {
    (fakeUpdate as jest.Mock).mockClear();
  });

  test('accepts a non-empty documents array', async () => {
    await updateDocuments(api, 'ns', {
      documents: [{ _id: '1', flavor: 'chocolate' }],
    });
    expect(fakeUpdate).toHaveBeenCalledTimes(1);
  });

  test('accepts a filter with setFields', async () => {
    await updateDocuments(api, 'ns', {
      filter: { flavor: { $eq: 'strawberry' } },
      setFields: { flavor: 'vanilla' },
    });
    expect(fakeUpdate).toHaveBeenCalledTimes(1);
  });

  test('accepts a filter with removeFields', async () => {
    await updateDocuments(api, 'ns', {
      filter: { flavor: { $eq: 'strawberry' } },
      removeFields: ['flavor'],
    });
    expect(fakeUpdate).toHaveBeenCalledTimes(1);
  });

  test('rejects documents combined with filter', async () => {
    await expect(
      updateDocuments(api, 'ns', {
        documents: [{ _id: '1' }],
        filter: { flavor: { $eq: 'strawberry' } },
      }),
    ).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message:
        '`documents` and `filter` are mutually exclusive in updateDocuments; pass one or the other.',
    });
    expect(fakeUpdate).not.toHaveBeenCalled();
  });

  test('rejects a request with neither documents nor filter', async () => {
    await expect(updateDocuments(api, 'ns', {})).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message:
        'You must pass either a non-empty `documents` array or a `filter` with `setFields` and/or `removeFields` to updateDocuments.',
    });
    expect(fakeUpdate).not.toHaveBeenCalled();
  });

  test('rejects an empty documents array without filter', async () => {
    await expect(
      updateDocuments(api, 'ns', { documents: [] }),
    ).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message:
        '`documents` must contain at least one document update in updateDocuments.',
    });
    expect(fakeUpdate).not.toHaveBeenCalled();
  });

  test('rejects a filter without setFields or removeFields', async () => {
    await expect(
      updateDocuments(api, 'ns', {
        filter: { flavor: { $eq: 'strawberry' } },
      }),
    ).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message:
        'A `filter` update requires a non-empty `setFields` and/or `removeFields`.',
    });
    expect(fakeUpdate).not.toHaveBeenCalled();
  });

  test('rejects a filter with only empty setFields/removeFields', async () => {
    await expect(
      updateDocuments(api, 'ns', {
        filter: { flavor: { $eq: 'strawberry' } },
        setFields: {},
        removeFields: [],
      }),
    ).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message:
        'A `filter` update requires a non-empty `setFields` and/or `removeFields`.',
    });
    expect(fakeUpdate).not.toHaveBeenCalled();
  });

  test('rejects documents combined with setFields', async () => {
    await expect(
      updateDocuments(api, 'ns', {
        documents: [{ _id: '1' }],
        setFields: { flavor: 'vanilla' },
      }),
    ).rejects.toThrow(
      '`setFields` and `removeFields` are only valid together with `filter` in updateDocuments; they cannot be combined with `documents`.',
    );
    expect(fakeUpdate).not.toHaveBeenCalled();
  });

  test('rejects documents combined with removeFields', async () => {
    await expect(
      updateDocuments(api, 'ns', {
        documents: [{ _id: '1' }],
        removeFields: ['flavor'],
      }),
    ).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message:
        '`setFields` and `removeFields` are only valid together with `filter` in updateDocuments; they cannot be combined with `documents`.',
    });
    expect(fakeUpdate).not.toHaveBeenCalled();
  });

  test('accepts documents alongside empty setFields and removeFields', async () => {
    await updateDocuments(api, 'ns', {
      documents: [{ _id: '1', flavor: 'chocolate' }],
      setFields: {},
      removeFields: [],
    });
    expect(fakeUpdate).toHaveBeenCalledTimes(1);
  });

  test('rejects an empty documents array combined with filter', async () => {
    await expect(
      updateDocuments(api, 'ns', {
        documents: [],
        filter: { flavor: { $eq: 'strawberry' } },
        setFields: { flavor: 'vanilla' },
      }),
    ).rejects.toThrow(
      '`documents` and `filter` are mutually exclusive in updateDocuments; pass one or the other.',
    );
    expect(fakeUpdate).not.toHaveBeenCalled();
  });

  test('rejects an empty documents array as an empty selection', async () => {
    await expect(updateDocuments(api, 'ns', { documents: [] })).rejects.toThrow(
      '`documents` must contain at least one document update in updateDocuments.',
    );
    expect(fakeUpdate).not.toHaveBeenCalled();
  });
});

import { fetchDocuments } from '../fetchDocuments';
import { deleteDocuments } from '../deleteDocuments';

describe('fetchDocuments argument validation', () => {
  const fakeFetch: (req: object) => Promise<object> = jest
    .fn()
    .mockImplementation(() => Promise.resolve({ documents: {} }));
  const api = { fetchDocuments: fakeFetch } as unknown as DocumentOperationsApi;

  beforeEach(() => (fakeFetch as jest.Mock).mockClear());

  test('accepts non-empty ids', async () => {
    await fetchDocuments(api, 'ns', { ids: ['1'] });
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });

  test('accepts a filter', async () => {
    await fetchDocuments(api, 'ns', { filter: { flavor: { $eq: 'mint' } } });
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });

  test('accepts a filter with paginationToken', async () => {
    await fetchDocuments(api, 'ns', {
      filter: { flavor: { $eq: 'mint' } },
      paginationToken: 'tok',
    });
    expect(fakeFetch).toHaveBeenCalledTimes(1);
  });

  test('rejects ids combined with filter', async () => {
    await expect(
      fetchDocuments(api, 'ns', {
        ids: ['1'],
        filter: { flavor: { $eq: 'mint' } },
      }),
    ).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message:
        '`ids` and `filter` are mutually exclusive in fetchDocuments; pass one or the other.',
    });
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  test('rejects neither ids nor filter', async () => {
    await expect(fetchDocuments(api, 'ns', {})).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message:
        'You must pass either a non-empty `ids` array or a `filter` to fetchDocuments.',
    });
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  test('rejects empty ids without filter', async () => {
    await expect(fetchDocuments(api, 'ns', { ids: [] })).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message: '`ids` must contain at least one document ID in fetchDocuments.',
    });
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  test('rejects paginationToken with ids', async () => {
    await expect(
      fetchDocuments(api, 'ns', { ids: ['1'], paginationToken: 'tok' }),
    ).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message:
        '`paginationToken` is only valid together with `filter` in fetchDocuments.',
    });
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  test('rejects an empty ids array combined with filter', async () => {
    await expect(
      fetchDocuments(api, 'ns', {
        ids: [],
        filter: { flavor: { $eq: 'mint' } },
      }),
    ).rejects.toThrow(
      '`ids` and `filter` are mutually exclusive in fetchDocuments; pass one or the other.',
    );
    expect(fakeFetch).not.toHaveBeenCalled();
  });

  test('rejects an empty ids array as an empty selection', async () => {
    await expect(fetchDocuments(api, 'ns', { ids: [] })).rejects.toThrow(
      '`ids` must contain at least one document ID in fetchDocuments.',
    );
    expect(fakeFetch).not.toHaveBeenCalled();
  });
});

describe('deleteDocuments argument validation', () => {
  const fakeDelete: (req: object) => Promise<object> = jest
    .fn()
    .mockImplementation(() => Promise.resolve({}));
  const api = {
    deleteDocuments: fakeDelete,
  } as unknown as DocumentOperationsApi;

  beforeEach(() => (fakeDelete as jest.Mock).mockClear());

  test('accepts ids', async () => {
    await deleteDocuments(api, 'ns', { ids: ['1'] });
    expect(fakeDelete).toHaveBeenCalledTimes(1);
  });

  test('accepts a filter', async () => {
    await deleteDocuments(api, 'ns', { filter: { flavor: { $eq: 'mint' } } });
    expect(fakeDelete).toHaveBeenCalledTimes(1);
  });

  test('accepts deleteAll', async () => {
    await deleteDocuments(api, 'ns', { deleteAll: true });
    expect(fakeDelete).toHaveBeenCalledTimes(1);
  });

  test('rejects no selector', async () => {
    await expect(deleteDocuments(api, 'ns', {})).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message:
        'You must specify exactly one of `ids`, `filter`, or `deleteAll` to deleteDocuments.',
    });
    expect(fakeDelete).not.toHaveBeenCalled();
  });

  test('rejects ids combined with filter', async () => {
    await expect(
      deleteDocuments(api, 'ns', {
        ids: ['1'],
        filter: { flavor: { $eq: 'mint' } },
      }),
    ).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message:
        '`ids`, `filter`, and `deleteAll` are mutually exclusive in deleteDocuments; pass exactly one.',
    });
    expect(fakeDelete).not.toHaveBeenCalled();
  });

  test('rejects filter combined with deleteAll', async () => {
    await expect(
      deleteDocuments(api, 'ns', {
        filter: { flavor: { $eq: 'mint' } },
        deleteAll: true,
      }),
    ).rejects.toMatchObject({
      name: 'PineconeArgumentError',
      message:
        '`ids`, `filter`, and `deleteAll` are mutually exclusive in deleteDocuments; pass exactly one.',
    });
    expect(fakeDelete).not.toHaveBeenCalled();
  });

  test('rejects empty ids array', async () => {
    await expect(deleteDocuments(api, 'ns', { ids: [] })).rejects.toMatchObject(
      {
        name: 'PineconeArgumentError',
        message:
          '`ids` must contain at least one document ID in deleteDocuments.',
      },
    );
    expect(fakeDelete).not.toHaveBeenCalled();
  });

  test('rejects an empty ids array combined with filter', async () => {
    await expect(
      deleteDocuments(api, 'ns', {
        ids: [],
        filter: { flavor: { $eq: 'mint' } },
      }),
    ).rejects.toThrow(
      '`ids`, `filter`, and `deleteAll` are mutually exclusive in deleteDocuments; pass exactly one.',
    );
    expect(fakeDelete).not.toHaveBeenCalled();
  });

  test('rejects an empty ids array with a specific message', async () => {
    await expect(deleteDocuments(api, 'ns', { ids: [] })).rejects.toThrow(
      '`ids` must contain at least one document ID in deleteDocuments.',
    );
    expect(fakeDelete).not.toHaveBeenCalled();
  });

  test('accepts ids alongside deleteAll set to false', async () => {
    await deleteDocuments(api, 'ns', { ids: ['1'], deleteAll: false });
    expect(fakeDelete).toHaveBeenCalledTimes(1);
  });
});
