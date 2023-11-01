import { createIndex } from '../createIndex';
import { IndexOperationsApi } from '../../pinecone-generated-ts-fetch';
import type {
  CreateIndexRequest,
  DescribeIndexRequest,
  IndexMeta,
} from '../../pinecone-generated-ts-fetch';

// describeIndexResponse can either be a single response, or an array of responses for testing polling scenarios
const setupCreateIndexResponse = (
  createIndexResponse,
  describeIndexResponse,
  isCreateIndexSuccess = true,
  isDescribeIndexSuccess = true
) => {
  const fakeCreateIndex: (req: CreateIndexRequest) => Promise<IndexMeta> = jest
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

  const fakeDescribeIndex: (req: DescribeIndexRequest) => Promise<IndexMeta> =
    describeIndexMock;

  const IOA = {
    createIndex: fakeCreateIndex,
    describeIndex: fakeDescribeIndex,
  } as IndexOperationsApi;

  return IOA;
};

describe('createIndex', () => {
  test('calls the openapi create index endpoint, passing name and dimension', async () => {
    const IOA = setupCreateIndexResponse(undefined, undefined);
    const returned = await createIndex(IOA)({
      name: 'index-name',
      dimension: 10,
      cloud: 'gcp',
      region: 'us-east1',
      capacityMode: 'pod',
    });

    expect(returned).toBe(void 0);
    expect(IOA.createIndex).toHaveBeenCalledWith({
      createRequest: {
        name: 'index-name',
        dimension: 10,
        capacityMode: 'pod',
        cloud: 'gcp',
        region: 'us-east1',
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
      const IOA = setupCreateIndexResponse(undefined, [
        {
          status: { ready: true, state: 'Ready' },
        },
      ]);

      const returned = await createIndex(IOA)({
        name: 'index-name',
        dimension: 10,
        cloud: 'gcp',
        region: 'us-east1',
        capacityMode: 'pod',
        waitUntilReady: true,
      });

      expect(returned).toBe(void 0);
      expect(IOA.createIndex).toHaveBeenCalledWith({
        createRequest: {
          name: 'index-name',
          dimension: 10,
          cloud: 'gcp',
          region: 'us-east1',
          capacityMode: 'pod',
          waitUntilReady: true,
        },
      });
      expect(IOA.describeIndex).toHaveBeenCalledWith({
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
        cloud: 'gcp',
        region: 'us-east1',
        capacityMode: 'pod',
        waitUntilReady: true,
      });

      await jest.advanceTimersByTimeAsync(3000);

      return returned.then((result) => {
        expect(result).toBe(void 0);
        expect(IOA.describeIndex).toHaveBeenNthCalledWith(3, {
          indexName: 'index-name',
        });
      });
    });
  });
});
