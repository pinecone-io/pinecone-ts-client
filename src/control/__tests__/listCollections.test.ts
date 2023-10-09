import { listCollections } from '../listCollections';

describe('listCollections', () => {
  test('should return a list of collection objects', async () => {
    const IOA = {
      listCollections: jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve(['collection-name', 'collection-name-2'])
        ),
    };

    // @ts-ignore
    const returned = await listCollections(IOA)();

    expect(returned).toEqual([
      { name: 'collection-name' },
      { name: 'collection-name-2' },
    ]);
  });
});
