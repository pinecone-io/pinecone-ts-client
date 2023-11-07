import { configureIndex } from '../configureIndex';
import { IndexOperationsApi } from '../../pinecone-generated-ts-fetch';
import type { ConfigureIndexRequest } from '../../pinecone-generated-ts-fetch';
import type { IndexMeta } from '../../index';

describe('configureIndex', () => {
  test('calls the openapi configure endpoint', async () => {
    const fakeConfigure: (req: ConfigureIndexRequest) => Promise<IndexMeta> =
      jest.fn();
    const IOA = { configureIndex: fakeConfigure } as IndexOperationsApi;

    const returned = await configureIndex(IOA)('index-name', { replicas: 10 });

    expect(returned).toBe(void 0);
    expect(IOA.configureIndex).toHaveBeenCalledWith({
      indexName: 'index-name',
      patchRequest: { replicas: 10 },
    });
  });
});
