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
