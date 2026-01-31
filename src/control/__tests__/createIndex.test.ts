import { createIndex } from '../createIndex';
import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/db_control';
import type {
  CreateIndexOperationRequest,
  DescribeIndexRequest,
  IndexModel,
} from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';
import { X_PINECONE_API_VERSION } from '../../pinecone-generated-ts-fetch/db_control/api_version';

// describeIndexResponse can either be a single response, or an array of responses for testing polling scenarios
const setupCreateIndexResponse = (
  createIndexResponse,
  describeIndexResponse,
  isCreateIndexSuccess = true,
  isDescribeIndexSuccess = true,
) => {
  const fakeCreateIndex: (
    req: CreateIndexOperationRequest,
  ) => Promise<IndexModel> = jest
    .fn()
    .mockImplementation(() =>
      isCreateIndexSuccess
        ? Promise.resolve(createIndexResponse)
        : Promise.reject(createIndexResponse),
    );

  // unfold describeIndexResponse
  const describeIndexResponses = Array.isArray(describeIndexResponse)
    ? describeIndexResponse
    : [describeIndexResponse];

  const describeIndexMock = jest.fn();
  describeIndexResponses.forEach((response) => {
    describeIndexMock.mockImplementationOnce(() =>
      isDescribeIndexSuccess
        ? Promise.resolve(response)
        : Promise.reject({ response }),
    );
  });

  const fakeDescribeIndex: (req: DescribeIndexRequest) => Promise<IndexModel> =
    describeIndexMock;

  const MIA = {
    createIndex: fakeCreateIndex,
    describeIndex: fakeDescribeIndex,
  } as ManageIndexesApi;

  return MIA;
};

describe('createIndex', () => {
  test('calls the openapi create index endpoint, passing name, dimension, metric, and spec', async () => {
    const MIA = setupCreateIndexResponse(undefined, undefined);
    const returned = await createIndex(MIA)({
      name: 'index-name',
      dimension: 10,
      metric: 'cosine',
      spec: {
        pod: {
          environment: 'us-west1',
          pods: 1,
          podType: 'p1.x1',
        },
      },
      tags: {
        example: 'tag',
      },
    });

    expect(returned).toEqual(void 0);
    expect(MIA.createIndex).toHaveBeenCalledWith({
      createIndexRequest: {
        name: 'index-name',
        dimension: 10,
        metric: 'cosine',
        spec: {
          pod: {
            environment: 'us-west1',
            pods: 1,
            podType: 'p1.x1',
          },
        },
        tags: {
          example: 'tag',
        },
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });

  test('default metric to "cosine" if not specified', async () => {
    const MIA = setupCreateIndexResponse(undefined, undefined);
    const returned = await createIndex(MIA)({
      name: 'index-name',
      dimension: 10,
      spec: {
        pod: {
          environment: 'us-west1',
          pods: 1,
          podType: 'p1.x1',
        },
      },
    });

    expect(returned).toEqual(void 0);
    expect(MIA.createIndex).toHaveBeenCalledWith({
      createIndexRequest: {
        name: 'index-name',
        dimension: 10,
        metric: 'cosine',
        spec: {
          pod: {
            environment: 'us-west1',
            pods: 1,
            podType: 'p1.x1',
          },
        },
      },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });

  test('Throw error if name, dimension, or spec are not passed', async () => {
    const MIA = setupCreateIndexResponse(undefined, undefined);
    // Missing name
    let toThrow = async () => {
      // @ts-ignore
      await createIndex(MIA)({
        dimension: 10,
        spec: {
          pod: {
            environment: 'us-west1',
            pods: 1,
            podType: 'p1.x1',
          },
        },
      });
    };

    await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow).rejects.toThrow(
      'You must pass a non-empty string for `name` in order to create an index.',
    );

    // Missing spec
    toThrow = async () => {
      // @ts-ignore
      await createIndex(MIA)({
        name: 'index-name',
        dimension: 10,
      });
    };
    await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow).rejects.toThrow(
      'You must pass a `pods`, `serverless`, or `byoc` `spec` object in order to create an index.',
    );

    // Missing dimension
    toThrow = async () => {
      // @ts-ignore
      await createIndex(MIA)({
        name: 'index-name',
        spec: {
          pod: {
            environment: 'us-west1',
            pods: 1,
            podType: 'p1.x1',
          },
        },
      });
    };
    await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow).rejects.toThrow(
      'You must pass a positive `dimension` when creating a dense index.',
    );
  });

  describe('waitUntilReady', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    test('when passed waitUntilReady, calls the create index endpoint and begins polling describeIndex', async () => {
      const MIA = setupCreateIndexResponse(undefined, [
        {
          status: { ready: true, state: 'Ready' },
        },
      ]);

      const returned = await createIndex(MIA)({
        name: 'index-name',
        dimension: 10,
        metric: 'cosine',
        spec: {
          pod: {
            environment: 'us-west1',
            pods: 1,
            podType: 'p1.x1',
          },
        },
        waitUntilReady: true,
      });

      expect(returned).toEqual({ status: { ready: true, state: 'Ready' } });
      expect(MIA.createIndex).toHaveBeenCalledWith({
        createIndexRequest: {
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            pod: {
              environment: 'us-west1',
              pods: 1,
              podType: 'p1.x1',
            },
          },
          waitUntilReady: true,
        },
        xPineconeApiVersion: X_PINECONE_API_VERSION,
      });
      expect(MIA.describeIndex).toHaveBeenCalledWith({
        indexName: 'index-name',
        xPineconeApiVersion: X_PINECONE_API_VERSION,
      });
    });

    test('will continue polling describeIndex if the index is not yet ready', async () => {
      const IOA = setupCreateIndexResponse(undefined, [
        {
          status: { ready: false, state: 'Initializing' },
        },
        {
          status: { ready: false, state: 'ScalingUp' },
        },
        {
          status: { ready: false, state: 'ScalingUp' },
        },
        {
          status: { ready: true, state: 'Ready' },
        },
      ]);

      const returned = createIndex(IOA)({
        name: 'index-name',
        dimension: 10,
        metric: 'cosine',
        spec: {
          pod: {
            environment: 'us-west1',
            pods: 1,
            podType: 'p1.x1',
          },
        },
        waitUntilReady: true,
      });

      await jest.advanceTimersByTimeAsync(3000);

      return returned.then((result) => {
        expect(result).toEqual({ status: { ready: true, state: 'Ready' } });
        expect(IOA.describeIndex).toHaveBeenNthCalledWith(3, {
          indexName: 'index-name',
          xPineconeApiVersion: X_PINECONE_API_VERSION,
        });
      });
    });
  });

  describe('createIndex with readCapacity', () => {
    test('creates serverless index with default OnDemand readCapacity', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      await createIndex(MIA)({
        name: 'serverless-index',
        dimension: 384,
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });

      expect(MIA.createIndex).toHaveBeenCalledWith({
        createIndexRequest: {
          name: 'serverless-index',
          dimension: 384,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
              readCapacity: undefined,
            },
          },
        },
        xPineconeApiVersion: X_PINECONE_API_VERSION,
      });
    });

    test('creates serverless index with explicit OnDemand readCapacity', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      await createIndex(MIA)({
        name: 'serverless-index',
        dimension: 384,
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
            readCapacity: { mode: 'OnDemand' },
          },
        },
      });

      expect(MIA.createIndex).toHaveBeenCalledWith({
        createIndexRequest: {
          name: 'serverless-index',
          dimension: 384,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
              readCapacity: { mode: 'OnDemand' },
            },
          },
        },
        xPineconeApiVersion: X_PINECONE_API_VERSION,
      });
    });

    test('creates serverless index with Dedicated readCapacity', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      await createIndex(MIA)({
        name: 'serverless-index',
        dimension: 384,
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
            readCapacity: {
              mode: 'Dedicated',
              nodeType: 'b1',
              manual: { replicas: 2, shards: 1 },
            },
          },
        },
      });

      expect(MIA.createIndex).toHaveBeenCalledWith({
        createIndexRequest: {
          name: 'serverless-index',
          dimension: 384,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
              readCapacity: {
                mode: 'Dedicated',
                dedicated: {
                  nodeType: 'b1',
                  scaling: 'Manual',
                  manual: { replicas: 2, shards: 1 },
                },
              },
            },
          },
        },
        xPineconeApiVersion: X_PINECONE_API_VERSION,
      });
    });

    test('creates serverless index with Dedicated readCapacity (mode omitted)', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      await createIndex(MIA)({
        name: 'serverless-index',
        dimension: 384,
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
            readCapacity: {
              nodeType: 't1',
              manual: { replicas: 4, shards: 2 },
            },
          },
        },
      });

      expect(MIA.createIndex).toHaveBeenCalledWith({
        createIndexRequest: {
          name: 'serverless-index',
          dimension: 384,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
              readCapacity: {
                mode: 'Dedicated',
                dedicated: {
                  nodeType: 't1',
                  scaling: 'Manual',
                  manual: { replicas: 4, shards: 2 },
                },
              },
            },
          },
        },
        xPineconeApiVersion: X_PINECONE_API_VERSION,
      });
    });
  });

  describe('createIndex with BYOC spec', () => {
    test('creates BYOC index successfully', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      await createIndex(MIA)({
        name: 'byoc-index',
        dimension: 128,
        spec: {
          byoc: {
            environment: 'us-east-1-aws',
          },
        },
      });

      expect(MIA.createIndex).toHaveBeenCalledWith({
        createIndexRequest: {
          name: 'byoc-index',
          dimension: 128,
          metric: 'cosine',
          spec: {
            byoc: {
              environment: 'us-east-1-aws',
            },
          },
        },
        xPineconeApiVersion: X_PINECONE_API_VERSION,
      });
    });

    test('throws error if BYOC environment is not provided', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      const toThrow = async () => {
        await createIndex(MIA)({
          name: 'byoc-index',
          dimension: 128,
          spec: {
            // @ts-ignore
            byoc: {},
          },
        });
      };

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        'You must pass an `environment` for the `CreateIndexByocSpec` object to create an index.',
      );
    });
  });

  describe('createIndex readCapacity validation', () => {
    test('throws error for invalid readCapacity mode', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      const toThrow = async () => {
        await createIndex(MIA)({
          name: 'serverless-index',
          dimension: 384,
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
              // @ts-ignore
              readCapacity: { mode: 'InvalidMode' },
            },
          },
        });
      };

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        /Invalid read capacity mode.*Valid values are.*OnDemand.*Dedicated/i,
      );
    });

    test('throws error for invalid dedicated nodeType', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      const toThrow = async () => {
        await createIndex(MIA)({
          name: 'serverless-index',
          dimension: 384,
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
              readCapacity: {
                // @ts-ignore
                nodeType: 'invalid',
                manual: { replicas: 1, shards: 1 },
              },
            },
          },
        });
      };

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        /Invalid node type.*Valid values are.*b1.*t1/i,
      );
    });

    test('throws error for missing manual config in dedicated mode', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'serverless-index',
          dimension: 384,
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
              // @ts-ignore
              readCapacity: {
                nodeType: 'b1',
              },
            },
          },
        });

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        /manual is required for dedicated mode/i,
      );
    });

    test('throws error for invalid replicas value', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'serverless-index',
          dimension: 384,
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
              readCapacity: {
                nodeType: 'b1',
                manual: { replicas: -1, shards: 1 },
              },
            },
          },
        });

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        /replicas must be 0 or a positive integer/i,
      );
    });

    test('throws error for invalid shards value', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'serverless-index',
          dimension: 384,
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
              readCapacity: {
                nodeType: 'b1',
                manual: { replicas: 1, shards: 0 },
              },
            },
          },
        });

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        /shards must be a positive integer/i,
      );
    });

    test('allows replicas to be 0 for dedicated mode', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      await createIndex(MIA)({
        name: 'serverless-index',
        dimension: 384,
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
            readCapacity: {
              nodeType: 'b1',
              manual: { replicas: 0, shards: 1 },
            },
          },
        },
      });

      expect(MIA.createIndex).toHaveBeenCalled();
    });

    test('accepts case-insensitive mode: lowercase "dedicated" is handled correctly', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      await createIndex(MIA)({
        name: 'serverless-index',
        dimension: 384,
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
            readCapacity: {
              // @ts-expect-error Testing runtime case-insensitive handling
              mode: 'dedicated',
              nodeType: 'b1',
              manual: { replicas: 2, shards: 1 },
            },
          },
        },
      });

      expect(MIA.createIndex).toHaveBeenCalledWith({
        createIndexRequest: {
          name: 'serverless-index',
          dimension: 384,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
              readCapacity: {
                mode: 'Dedicated',
                dedicated: {
                  nodeType: 'b1',
                  scaling: 'Manual',
                  manual: { replicas: 2, shards: 1 },
                },
              },
            },
          },
        },
        xPineconeApiVersion: X_PINECONE_API_VERSION,
      });
    });

    test('throws error when case-insensitive "dedicated" mode is missing required nodeType', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'serverless-index',
          dimension: 384,
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
              readCapacity: {
                mode: 'dedicated' as any, // Testing runtime case-insensitive handling
                manual: { replicas: 1, shards: 1 },
              },
            },
          },
        });

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        /Invalid node type.*Valid values are.*b1.*t1/i,
      );
    });

    test('throws error when case-insensitive "dedicated" mode is missing manual config', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      const toThrow = async () =>
        await createIndex(MIA)({
          name: 'serverless-index',
          dimension: 384,
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
              readCapacity: {
                mode: 'dedicated' as any, // Testing runtime case-insensitive handling
                nodeType: 'b1',
              } as any, // Missing manual field
            },
          },
        });

      await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
      await expect(toThrow).rejects.toThrowError(
        /manual is required for dedicated mode/i,
      );
    });

    test('accepts case-insensitive mode: lowercase "ondemand" is handled correctly', async () => {
      const MIA = setupCreateIndexResponse(undefined, undefined);
      await createIndex(MIA)({
        name: 'serverless-index',
        dimension: 384,
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
            readCapacity: {
              mode: 'ondemand' as any, // Testing runtime case-insensitive handling
            },
          },
        },
      });

      expect(MIA.createIndex).toHaveBeenCalledWith({
        createIndexRequest: {
          name: 'serverless-index',
          dimension: 384,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1',
              readCapacity: { mode: 'OnDemand' },
            },
          },
        },
        xPineconeApiVersion: X_PINECONE_API_VERSION,
      });
    });
  });
});
