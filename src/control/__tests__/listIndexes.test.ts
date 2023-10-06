import { listIndexes } from '../listIndexes';

describe('listIndexes', () => {
  test('should return a list of index objects', async () => {
    const IndexOperationsApi = {
      listIndexes: jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve(['index-name', 'index-name-2'])
        ),
    };

    // @ts-ignore
    const returned = await listIndexes(IndexOperationsApi)();

    expect(returned).toEqual([
      { name: 'index-name' },
      { name: 'index-name-2' },
    ]);
  });
});
