import { createIndex } from '../createIndex';
import { ManagePodIndexesApi } from '../../pinecone-generated-ts-fetch';
import type {
  CreateIndexOperationRequest,
  DescribeIndexRequest,
  IndexModel,
} from '../../pinecone-generated-ts-fetch';

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

  const MPIA = {
    createIndex: fakeCreateIndex,
    describeIndex: fakeDescribeIndex,
  } as ManagePodIndexesApi;

  return MPIA;
};

describe('createIndex', () => {
  test('calls the openapi create index endpoint, passing name, dimension, metric, and spec', async () => {
    const MPIA = setupCreateIndexResponse(undefined, undefined);
    const returned = await createIndex(MPIA)({
      name: 'index-name',
      dimension: 10,
      metric: 'cosine',
      spec: {
        pod: {
          environment: 'us-west1',
          replicas: 1,
          shards: 1,
          pods: 1,
          podType: 'p1.x1',
        },
      },
    });

    expect(returned).toEqual(void 0);
    expect(MPIA.createIndex).toHaveBeenCalledWith({
      createIndexRequest: {
        name: 'index-name',
        dimension: 10,
        metric: 'cosine',
        spec: {
          pod: {
            environment: 'us-west1',
            replicas: 1,
            shards: 1,
            pods: 1,
            podType: 'p1.x1',
          },
        },
      },
    });
  });

  test('default metric to "cosine" if not specified', async () => {
    const MPIA = setupCreateIndexResponse(undefined, undefined);
    const returned = await createIndex(MPIA)({
      name: 'index-name',
      dimension: 10,
      spec: {
        pod: {
          environment: 'us-west1',
          replicas: 1,
          shards: 1,
          pods: 1,
          podType: 'p1.x1',
        },
      },
    });

    expect(returned).toEqual(void 0);
    expect(MPIA.createIndex).toHaveBeenCalledWith({
      createIndexRequest: {
        name: 'index-name',
        dimension: 10,
        metric: 'cosine',
        spec: {
          pod: {
            environment: 'us-west1',
            replicas: 1,
            shards: 1,
            pods: 1,
            podType: 'p1.x1',
          },
        },
      },
    });
  });

  describe('waitUntilReady', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    test('when passed waitUntilReady, calls the create index endpoint and begins polling describeIndex', async () => {
      const MPIA = setupCreateIndexResponse(undefined, [
        {
          status: { ready: true, state: 'Ready' },
        },
      ]);

      const returned = await createIndex(MPIA)({
        name: 'index-name',
        dimension: 10,
        metric: 'cosine',
        spec: {
          pod: {
            environment: 'us-west1',
            replicas: 1,
            shards: 1,
            pods: 1,
            podType: 'p1.x1',
          },
        },
        waitUntilReady: true,
      });

      expect(returned).toEqual({ status: { ready: true, state: 'Ready' } });
      expect(MPIA.createIndex).toHaveBeenCalledWith({
        createIndexRequest: {
          name: 'index-name',
          dimension: 10,
          metric: 'cosine',
          spec: {
            pod: {
              environment: 'us-west1',
              replicas: 1,
              shards: 1,
              pods: 1,
              podType: 'p1.x1',
            },
          },
          waitUntilReady: true,
        },
      });
      expect(MPIA.describeIndex).toHaveBeenCalledWith({
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
            replicas: 1,
            shards: 1,
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
