import { createIndex } from '../createIndex';
import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/db_control';
import type {
  CreateIndexOperationRequest,
  DescribeIndexRequest,
  IndexModel,
} from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';

// describeIndexResponse can either be a single response, or an array of responses for testing polling scenarios
const setupCreateIndexResponse = (
  createIndexResponse,
  describeIndexResponse,
  isCreateIndexSuccess = true,
  isDescribeIndexSuccess = true
) => {
  const fakeCreateIndex: (
    req: CreateIndexOperationRequest
  ) => Promise<IndexModel> = jest
    .fn()
    .mockImplementation(() =>
      isCreateIndexSuccess
        ? Promise.resolve(createIndexResponse)
        : Promise.reject(createIndexResponse)
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
        : Promise.reject({ response })
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
      'You must pass a non-empty string for `name` in order to create an index.'
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
      'You must pass a `pods` or `serverless` `spec` object in order to create an index.'
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
      'You must pass a positive integer for `dimension` in order to create an index.'
    );
  });

  test('Throw error if unknown property is passed at top level', async () => {
    const MIA = setupCreateIndexResponse(undefined, undefined);
    // Missing name
    const toThrow = async () => {
      await createIndex(MIA)({
        // @ts-ignore
        dimensionlshgoiwe: 10,
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
    await expect(toThrow).rejects.toThrowError(
      'Object contained invalid properties: dimensionlshgoiwe. Valid properties include spec, name, dimension,' +
        ' metric, deletionProtection, waitUntilReady, suppressConflicts, tags.'
    );
  });

  test('Throw error if unknown property is passed at spec level', async () => {
    const MIA = setupCreateIndexResponse(undefined, undefined);
    const toThrow = async () => {
      await createIndex(MIA)({
        name: 'index-name',
        dimension: 10,
        spec: {
          // @ts-ignore
          poddf: {
            environment: 'us-west1',
            pods: 1,
            podType: 'p1.x1',
          },
        },
      });
    };

    await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow).rejects.toThrowError(
      'Object contained invalid properties: poddf. Valid properties include serverless, pod.'
    );
  });

  test('Throw error if unknown property is passed at spec/pod level', async () => {
    const MIA = setupCreateIndexResponse(undefined, undefined);
    const toThrow = async () => {
      await createIndex(MIA)({
        name: 'index-name',
        dimension: 10,
        spec: {
          pod: {
            // @ts-ignore
            environmentsdf: 'us-west1',
            pods: 1,
            podType: 'p1.x1',
          },
        },
      });
    };

    await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow).rejects.toThrowError(
      'Object contained invalid properties: environmentsdf. Valid properties include environment, replicas, shards, podType, pods, metadataConfig, sourceCollection.'
    );
  });

  test('Throw error if unknown property is passed at spec/serverless level', async () => {
    const MIA = setupCreateIndexResponse(undefined, undefined);
    const toThrow = async () => {
      await createIndex(MIA)({
        name: 'index-name',
        dimension: 10,
        spec: {
          serverless: {
            // @ts-ignore
            cloudsdfd: 'wooo',
            region: 'us-west1',
          },
        },
      });
    };

    await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow).rejects.toThrowError(
      'Object contained invalid properties: cloudsdfd. Valid properties include cloud, region.'
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
      });
      expect(MIA.describeIndex).toHaveBeenCalledWith({
        indexName: 'index-name',
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
        });
      });
    });
  });
});
