import { configureIndex } from '../configureIndex';
import { ManagePodIndexesApi } from '../../pinecone-generated-ts-fetch';
import type {
  ConfigureIndexOperationRequest,
  IndexModel,
} from '../../pinecone-generated-ts-fetch';

describe('configureIndex', () => {
  test('calls the openapi configure endpoint', async () => {
    const fakeConfigure: (
      req: ConfigureIndexOperationRequest
    ) => Promise<IndexModel> = jest.fn();
    const IOA = { configureIndex: fakeConfigure } as ManagePodIndexesApi;

    const returned = await configureIndex(IOA)({
      indexName: 'index-name',
      configureIndexRequest: {
        spec: { pod: { replicas: 4, podType: 'p2.x2' } },
      },
    });

    expect(returned).toBe(void 0);
    expect(IOA.configureIndex).toHaveBeenCalledWith({
      indexName: 'index-name',
      configureIndexRequest: {
        spec: { pod: { replicas: 4, podType: 'p2.x2' } },
      },
    });
  });
});
