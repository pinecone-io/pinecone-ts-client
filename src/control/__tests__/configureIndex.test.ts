import { configureIndex, getIndexSpecType } from '../configureIndex';
import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/db_control';
import type {
  ConfigureIndexOperationRequest,
  IndexModel,
  DescribeIndexRequest,
} from '../../pinecone-generated-ts-fetch/db_control';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control/api_version';

describe('configureIndex', () => {
  const podIndexModel: IndexModel = {
    name: 'pod-index',
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
    deletionProtection: 'disabled',
  };

  const serverlessIndexModel: IndexModel = {
    name: 'serverless-index',
    dimension: 5,
    metric: 'cosine',
    host: 'https://serverless-host.com',
    vectorType: 'dense',
    spec: {
      serverless: {
        cloud: 'aws',
        region: 'us-east-1',
        readCapacity: {
          mode: 'OnDemand',
          status: {
            state: 'Ready',
          },
        },
      },
    },
    status: {
      ready: true,
      state: 'Ready',
    },
    deletionProtection: 'enabled',
  };

  const byocIndexModel: IndexModel = {
    name: 'byoc-index',
    dimension: 5,
    metric: 'cosine',
    host: 'https://byoc-host.com',
    vectorType: 'dense',
    spec: {
      byoc: {
        environment: 'my-byoc-env',
        readCapacity: {
          mode: 'OnDemand',
          status: {
            state: 'Ready',
          },
        },
      },
    },
    status: {
      ready: true,
      state: 'Ready',
    },
    deletionProtection: 'disabled',
  };

  test('calls the openapi configure endpoint with pod index configuration', async () => {
    const fakeDescribe: (req: DescribeIndexRequest) => Promise<IndexModel> =
      jest.fn().mockResolvedValue(podIndexModel);
    const fakeConfigure: (
      req: ConfigureIndexOperationRequest,
    ) => Promise<IndexModel> = jest.fn().mockResolvedValue(podIndexModel);
    const IOA = {
      describeIndex: fakeDescribe,
      configureIndex: fakeConfigure,
    } as ManageIndexesApi;

    const returned = await configureIndex(IOA)({
      name: 'pod-index',
      podReplicas: 4,
      podType: 'p2.x2',
      deletionProtection: 'disabled',
      tags: {
        example: 'tag',
      },
    });

    expect(returned).toBe(podIndexModel);
    expect(IOA.describeIndex).toHaveBeenCalledWith({
      indexName: 'pod-index',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
    expect(IOA.configureIndex).toHaveBeenCalledWith({
      indexName: 'pod-index',
      configureIndexRequest: {
        spec: { pod: { replicas: 4, podType: 'p2.x2' } },
        deletionProtection: 'disabled',
        tags: {
          example: 'tag',
        },
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });

  test('calls the openapi configure endpoint with serverless index configuration', async () => {
    const fakeDescribe: (req: DescribeIndexRequest) => Promise<IndexModel> =
      jest.fn().mockResolvedValue(serverlessIndexModel);
    const fakeConfigure: (
      req: ConfigureIndexOperationRequest,
    ) => Promise<IndexModel> = jest
      .fn()
      .mockResolvedValue(serverlessIndexModel);
    const IOA = {
      describeIndex: fakeDescribe,
      configureIndex: fakeConfigure,
    } as ManageIndexesApi;

    const returned = await configureIndex(IOA)({
      name: 'serverless-index',
      readCapacity: {
        mode: 'Dedicated',
        nodeType: 't1',
        manual: {
          replicas: 2,
          shards: 3,
        },
      },
    });

    expect(returned).toBe(serverlessIndexModel);
    expect(IOA.describeIndex).toHaveBeenCalledWith({
      indexName: 'serverless-index',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
    expect(IOA.configureIndex).toHaveBeenCalledWith({
      indexName: 'serverless-index',
      configureIndexRequest: {
        spec: {
          serverless: {
            readCapacity: {
              mode: 'Dedicated',
              dedicated: {
                nodeType: 't1',
                scaling: 'Manual',
                manual: {
                  replicas: 2,
                  shards: 3,
                },
              },
            },
          },
        },
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });

  test('calls the openapi configure endpoint with BYOC index configuration', async () => {
    const fakeDescribe: (req: DescribeIndexRequest) => Promise<IndexModel> =
      jest.fn().mockResolvedValue(byocIndexModel);
    const fakeConfigure: (
      req: ConfigureIndexOperationRequest,
    ) => Promise<IndexModel> = jest.fn().mockResolvedValue(byocIndexModel);
    const IOA = {
      describeIndex: fakeDescribe,
      configureIndex: fakeConfigure,
    } as ManageIndexesApi;

    const returned = await configureIndex(IOA)({
      name: 'byoc-index',
      readCapacity: {
        mode: 'OnDemand',
      },
    });

    expect(returned).toBe(byocIndexModel);
    expect(IOA.describeIndex).toHaveBeenCalledWith({
      indexName: 'byoc-index',
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
    expect(IOA.configureIndex).toHaveBeenCalledWith({
      indexName: 'byoc-index',
      configureIndexRequest: {
        spec: {
          byoc: {
            readCapacity: {
              mode: 'OnDemand',
            },
          },
        },
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });

  test('throws error when trying to configure readCapacity on pod index', async () => {
    const fakeDescribe: (req: DescribeIndexRequest) => Promise<IndexModel> =
      jest.fn().mockResolvedValue(podIndexModel);
    const IOA = {
      describeIndex: fakeDescribe,
      configureIndex: jest.fn(),
    } as unknown as ManageIndexesApi;

    await expect(
      configureIndex(IOA)({
        name: 'pod-index',
        readCapacity: { mode: 'OnDemand' },
      }),
    ).rejects.toThrow(
      'Cannot configure readCapacity on a pod index; readCapacity is only supported for serverless and BYOC indexes.',
    );

    expect(IOA.describeIndex).toHaveBeenCalled();
    expect(IOA.configureIndex).not.toHaveBeenCalled();
  });

  test('throws error when trying to configure podReplicas on serverless index', async () => {
    const fakeDescribe: (req: DescribeIndexRequest) => Promise<IndexModel> =
      jest.fn().mockResolvedValue(serverlessIndexModel);
    const IOA = {
      describeIndex: fakeDescribe,
      configureIndex: jest.fn(),
    } as unknown as ManageIndexesApi;

    await expect(
      configureIndex(IOA)({
        name: 'serverless-index',
        podReplicas: 4,
      }),
    ).rejects.toThrow(
      'Cannot configure podReplicas or podType on a serverless index; these parameters are only supported for pod indexes.',
    );

    expect(IOA.describeIndex).toHaveBeenCalled();
    expect(IOA.configureIndex).not.toHaveBeenCalled();
  });

  test('throws error when trying to configure podType on BYOC index', async () => {
    const fakeDescribe: (req: DescribeIndexRequest) => Promise<IndexModel> =
      jest.fn().mockResolvedValue(byocIndexModel);
    const IOA = {
      describeIndex: fakeDescribe,
      configureIndex: jest.fn(),
    } as unknown as ManageIndexesApi;

    await expect(
      configureIndex(IOA)({
        name: 'byoc-index',
        podType: 'p1.x1',
      }),
    ).rejects.toThrow(
      'Cannot configure podReplicas or podType on a byoc index; these parameters are only supported for pod indexes.',
    );

    expect(IOA.describeIndex).toHaveBeenCalled();
    expect(IOA.configureIndex).not.toHaveBeenCalled();
  });
});

describe('getIndexSpecType', () => {
  // IndexModelSpecFromJSON merges BYOC, PodBased, Serverless FromJSON results,
  // so spec can have pod/serverless/byoc all present with some undefined.
  // getIndexSpecType must classify by defined value, not key presence.

  test('returns serverless when only serverless has a defined value (merged FromJSON shape)', () => {
    const spec = {
      pod: undefined,
      serverless: {
        cloud: 'aws',
        region: 'us-east-1',
        readCapacity: { mode: 'OnDemand', status: { state: 'Ready' } },
      },
      byoc: undefined,
    };
    expect(
      getIndexSpecType(spec as Parameters<typeof getIndexSpecType>[0]),
    ).toBe('serverless');
  });

  test('returns pod when only pod has a defined value (merged FromJSON shape)', () => {
    const spec = {
      pod: {
        environment: 'us-east1-gcp',
        replicas: 4,
        shards: 1,
        pods: 4,
        podType: 'p2.x2',
      },
      serverless: undefined,
      byoc: undefined,
    };
    expect(
      getIndexSpecType(spec as Parameters<typeof getIndexSpecType>[0]),
    ).toBe('pod');
  });

  test('returns byoc when only byoc has a defined value (merged FromJSON shape)', () => {
    const spec = {
      pod: undefined,
      serverless: undefined,
      byoc: {
        environment: 'my-env',
        readCapacity: { mode: 'OnDemand', status: { state: 'Ready' } },
      },
    };
    expect(
      getIndexSpecType(spec as Parameters<typeof getIndexSpecType>[0]),
    ).toBe('byoc');
  });

  test('returns unknown for null or non-object', () => {
    expect(
      getIndexSpecType(
        null as unknown as Parameters<typeof getIndexSpecType>[0],
      ),
    ).toBe('unknown');
    expect(
      getIndexSpecType(
        undefined as unknown as Parameters<typeof getIndexSpecType>[0],
      ),
    ).toBe('unknown');
  });
});
