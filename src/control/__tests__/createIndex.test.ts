import { createIndex } from '../createIndex';
import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/control';
import type {
  CreateIndexOperationRequest,
  DescribeIndexRequest,
  IndexModel,
} from '../../pinecone-generated-ts-fetch/control';

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
          shards: 1,
          replicas: 1,
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
            shards: 1,
            replicas: 1,
            podType: 'p1.x1',
          },
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
          shards: 1,
          replicas: 1,
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
            shards: 1,
            replicas: 1,
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
            shards: 1,
            replicas: 1,
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
              shards: 1,
              replicas: 1,
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
            shards: 1,
            replicas: 1,
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
