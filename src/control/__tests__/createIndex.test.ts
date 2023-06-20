import { createIndex } from '../createIndex';
import { IndexOperationsApi } from '../../pinecone-generated-ts-fetch';

describe('createIndex', () => {
  let IOA: IndexOperationsApi;
  beforeEach(() => {
    // @ts-ignore
    IOA = { createIndex: jest.fn() };
    jest.mock('../../pinecone-generated-ts-fetch', () => ({
      IndexOperationsApi: IOA,
    }));
  });

  test('calls the create endpoint', async () => {
    const returned = await createIndex(IOA)({
      name: 'index-name',
      dimension: 10,
    });

    expect(returned).toBe(void 0);
    expect(IOA.createIndex).toHaveBeenCalled();
  });
});
