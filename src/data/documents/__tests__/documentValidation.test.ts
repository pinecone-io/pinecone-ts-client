import { updateDocuments } from '../updateDocuments';
import type { DocumentOperationsApi } from '../../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../../errors';

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
    ).rejects.toThrow(PineconeArgumentError);
    expect(fakeUpdate).not.toHaveBeenCalled();
  });

  test('rejects a request with neither documents nor filter', async () => {
    await expect(updateDocuments(api, 'ns', {})).rejects.toThrow(
      PineconeArgumentError,
    );
    expect(fakeUpdate).not.toHaveBeenCalled();
  });

  test('rejects an empty documents array without filter', async () => {
    await expect(updateDocuments(api, 'ns', { documents: [] })).rejects.toThrow(
      PineconeArgumentError,
    );
    expect(fakeUpdate).not.toHaveBeenCalled();
  });

  test('rejects a filter without setFields or removeFields', async () => {
    await expect(
      updateDocuments(api, 'ns', {
        filter: { flavor: { $eq: 'strawberry' } },
      }),
    ).rejects.toThrow(PineconeArgumentError);
    expect(fakeUpdate).not.toHaveBeenCalled();
  });

  test('rejects a filter with only empty setFields/removeFields', async () => {
    await expect(
      updateDocuments(api, 'ns', {
        filter: { flavor: { $eq: 'strawberry' } },
        setFields: {},
        removeFields: [],
      }),
    ).rejects.toThrow(PineconeArgumentError);
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
    ).rejects.toThrow(PineconeArgumentError);
  });

  test('rejects neither ids nor filter', async () => {
    await expect(fetchDocuments(api, 'ns', {})).rejects.toThrow(
      PineconeArgumentError,
    );
  });

  test('rejects empty ids without filter', async () => {
    await expect(fetchDocuments(api, 'ns', { ids: [] })).rejects.toThrow(
      PineconeArgumentError,
    );
  });

  test('rejects paginationToken with ids', async () => {
    await expect(
      fetchDocuments(api, 'ns', { ids: ['1'], paginationToken: 'tok' }),
    ).rejects.toThrow(PineconeArgumentError);
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
    await expect(deleteDocuments(api, 'ns', {})).rejects.toThrow(
      PineconeArgumentError,
    );
  });

  test('rejects ids combined with filter', async () => {
    await expect(
      deleteDocuments(api, 'ns', {
        ids: ['1'],
        filter: { flavor: { $eq: 'mint' } },
      }),
    ).rejects.toThrow(PineconeArgumentError);
  });

  test('rejects filter combined with deleteAll', async () => {
    await expect(
      deleteDocuments(api, 'ns', {
        filter: { flavor: { $eq: 'mint' } },
        deleteAll: true,
      }),
    ).rejects.toThrow(PineconeArgumentError);
  });

  test('rejects empty ids array', async () => {
    await expect(deleteDocuments(api, 'ns', { ids: [] })).rejects.toThrow(
      PineconeArgumentError,
    );
  });
});
