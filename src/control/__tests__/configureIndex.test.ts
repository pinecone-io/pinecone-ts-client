import { configureIndex } from '../configureIndex';
import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/db_control';
import type {
  ConfigureIndexOperationRequest,
  IndexModel,
} from '../../pinecone-generated-ts-fetch/db_control';

describe('configureIndex', () => {
  const indexModel: IndexModel = {
    name: 'index-name',
    dimension: 5,
    metric: 'cosine',
    host: 'https://index-host.com',
    vectorType: 'dense',
    spec: {
      pod: {
        environment: 'us-east1-gcp',
        replicas: 4,
        shards: 1,
        pods: 4,
        podType: 'p2.x2',
      },
    },
    status: {
      ready: true,
      state: 'Ready',
    },
    tags: {
      example: 'tag',
    },
    deletionProtection: 'disabled', // Redundant, but for example purposes
  };

  test('calls the openapi configure endpoint with pod index configuration', async () => {
    const fakeConfigure: (
      req: ConfigureIndexOperationRequest
    ) => Promise<IndexModel> = jest.fn().mockResolvedValue(indexModel);
    const IOA = {
      configureIndex: fakeConfigure,
    } as ManageIndexesApi;

    const returned = await configureIndex(IOA)('index-name', {
      podReplicas: 4,
      podType: 'p2.x2',
      deletionProtection: 'disabled',
      tags: {
        example: 'tag',
      },
    });

    expect(returned).toBe(indexModel);
    expect(IOA.configureIndex).toHaveBeenCalledWith({
      indexName: 'index-name',
      configureIndexRequest: {
        spec: { pod: { replicas: 4, podType: 'p2.x2' } },
        deletionProtection: 'disabled',
        tags: {
          example: 'tag',
        },
      },
      xPineconeApiVersion: '2025-10',
    });
  });
});
