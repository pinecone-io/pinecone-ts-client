import {
  createIndexForModel,
  CreateIndexForModelOptions,
} from '../createIndexForModel';
import { ManageIndexesApi } from '../../pinecone-generated-ts-fetch/db_control';
import type {
  CreateIndexForModelOperationRequest,
  DescribeIndexRequest,
  IndexModel,
} from '../../pinecone-generated-ts-fetch/db_control';
import { PineconeArgumentError } from '../../errors';

// describeIndexResponse can either be a single response, or an array of responses for testing polling scenarios
const setupCreateIndexForModelResponse = (
  createIndexForModelResponse,
  describeIndexResponse,
  isCreateIndexSuccess = true,
  isDescribeIndexSuccess = true
) => {
  const fakeCreateIndexForModel: (
    req: CreateIndexForModelOperationRequest
  ) => Promise<IndexModel> = jest
    .fn()
    .mockImplementation(() =>
      isCreateIndexSuccess
        ? Promise.resolve(createIndexForModelResponse)
        : Promise.reject(createIndexForModelResponse)
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
    createIndexForModel: fakeCreateIndexForModel,
    describeIndex: fakeDescribeIndex,
  } as ManageIndexesApi;

  return MIA;
};

describe('createIndexForModel', () => {
  test('calls the openapi create index for model endpoint', async () => {
    const MIA = setupCreateIndexForModelResponse(
      { name: 'test-index' },
      {
        status: { ready: true, state: 'Ready' },
      }
    );
    const mockCreateReq = {
      name: 'test-index',
      cloud: 'aws',
      region: 'us-east-1',
      embed: {
        model: 'test-model',
        metric: 'cosine',
        fieldMap: { testField: 'test-field' },
        readParameters: { testReadParam: 'test-read-param' },
        writeParameters: { testWriteParam: 'test-write-param' },
      },
      deletionProtection: 'enabled',
      tags: { testTag: 'test-tag' },
    } as CreateIndexForModelOptions;

    await createIndexForModel(MIA)(mockCreateReq);

    expect(MIA.createIndexForModel).toHaveBeenCalledWith({
      createIndexForModelRequest: mockCreateReq,
      xPineconeApiVersion: '2025-10',
    });
  });

  test('throws error if no name is passed', async () => {
    const MIA = setupCreateIndexForModelResponse(undefined, undefined);

    try {
      // @ts-ignore
      await createIndexForModel(MIA)({
        cloud: 'aws',
        region: 'us-east-1',
        embed: {
          model: 'test-model',
          fieldMap: { testField: 'test-field' },
        },
      });
    } catch (err) {
      expect(err).toBeInstanceOf(PineconeArgumentError);
      expect((err as PineconeArgumentError).message).toBe(
        'You must pass a non-empty string for `name` in order to create an index.'
      );
    }
  });

  test('throws error if no cloud is passed', async () => {
    const MIA = setupCreateIndexForModelResponse(undefined, undefined);

    try {
      // @ts-ignore
      await createIndexForModel(MIA)({
        name: 'test-index',
        region: 'us-east-1',
        embed: {
          model: 'test-model',
          fieldMap: { testField: 'test-field' },
        },
      });
    } catch (err) {
      expect(err).toBeInstanceOf(PineconeArgumentError);
      expect((err as PineconeArgumentError).message).toBe(
        'You must pass a non-empty string for `cloud` in order to create an index.'
      );
    }
  });

  test('throws error if no region is passed', async () => {
    const MIA = setupCreateIndexForModelResponse(undefined, undefined);

    try {
      // @ts-ignore
      await createIndexForModel(MIA)({
        name: 'test-index',
        cloud: 'aws',
        embed: {
          model: 'test-model',
          fieldMap: { testField: 'test-field' },
        },
      });
    } catch (err) {
      expect(err).toBeInstanceOf(PineconeArgumentError);
      expect((err as PineconeArgumentError).message).toBe(
        'You must pass a non-empty string for `region` in order to create an index.'
      );
    }
  });

  test('throws error if no embed object is passed', async () => {
    const MIA = setupCreateIndexForModelResponse(undefined, undefined);

    try {
      // @ts-ignore
      await createIndexForModel(MIA)({
        name: 'test-index',
        cloud: 'aws',
        region: 'us-east-1',
      });
    } catch (err) {
      expect(err).toBeInstanceOf(PineconeArgumentError);
      expect((err as PineconeArgumentError).message).toBe(
        'You must pass an `embed` object in order to create an index.'
      );
    }
  });

  describe('createIndexForModel with readCapacity', () => {
    test('creates index with default OnDemand readCapacity when omitted', async () => {
      const MIA = setupCreateIndexForModelResponse(
        { name: 'test-index' },
        { status: { ready: true, state: 'Ready' } }
      );

      await createIndexForModel(MIA)({
        name: 'test-index',
        cloud: 'aws',
        region: 'us-east-1',
        embed: {
          model: 'multilingual-e5-large',
          fieldMap: { text: 'text' },
        },
      });

      expect(MIA.createIndexForModel).toHaveBeenCalledWith({
        createIndexForModelRequest: {
          name: 'test-index',
          cloud: 'aws',
          region: 'us-east-1',
          embed: {
            model: 'multilingual-e5-large',
            fieldMap: { text: 'text' },
          },
          readCapacity: undefined,
        },
        xPineconeApiVersion: '2025-10',
      });
    });

    test('creates index with explicit OnDemand readCapacity', async () => {
      const MIA = setupCreateIndexForModelResponse(
        { name: 'test-index' },
        { status: { ready: true, state: 'Ready' } }
      );

      await createIndexForModel(MIA)({
        name: 'test-index',
        cloud: 'aws',
        region: 'us-east-1',
        embed: {
          model: 'multilingual-e5-large',
          fieldMap: { text: 'text' },
        },
        readCapacity: { mode: 'OnDemand' },
      });

      expect(MIA.createIndexForModel).toHaveBeenCalledWith({
        createIndexForModelRequest: {
          name: 'test-index',
          cloud: 'aws',
          region: 'us-east-1',
          embed: {
            model: 'multilingual-e5-large',
            fieldMap: { text: 'text' },
          },
          readCapacity: { mode: 'OnDemand' },
        },
        xPineconeApiVersion: '2025-10',
      });
    });

    test('creates index with Dedicated readCapacity', async () => {
      const MIA = setupCreateIndexForModelResponse(
        { name: 'test-index' },
        { status: { ready: true, state: 'Ready' } }
      );

      await createIndexForModel(MIA)({
        name: 'test-index',
        cloud: 'gcp',
        region: 'us-central1',
        embed: {
          model: 'multilingual-e5-large',
          fieldMap: { text: 'text' },
        },
        readCapacity: {
          mode: 'Dedicated',
          nodeType: 't1',
          manual: { replicas: 3, shards: 2 },
        },
      });

      expect(MIA.createIndexForModel).toHaveBeenCalledWith({
        createIndexForModelRequest: {
          name: 'test-index',
          cloud: 'gcp',
          region: 'us-central1',
          embed: {
            model: 'multilingual-e5-large',
            fieldMap: { text: 'text' },
          },
          readCapacity: {
            mode: 'Dedicated',
            dedicated: {
              nodeType: 't1',
              scaling: 'Manual',
              manual: { replicas: 3, shards: 2 },
            },
          },
        },
        xPineconeApiVersion: '2025-10',
      });
    });

    test('creates index with Dedicated readCapacity (mode inferred)', async () => {
      const MIA = setupCreateIndexForModelResponse(
        { name: 'test-index' },
        { status: { ready: true, state: 'Ready' } }
      );

      await createIndexForModel(MIA)({
        name: 'test-index',
        cloud: 'azure',
        region: 'eastus2',
        embed: {
          model: 'multilingual-e5-large',
          fieldMap: { text: 'text' },
        },
        readCapacity: {
          nodeType: 'b1',
          manual: { replicas: 1, shards: 1 },
        },
      });

      expect(MIA.createIndexForModel).toHaveBeenCalledWith({
        createIndexForModelRequest: {
          name: 'test-index',
          cloud: 'azure',
          region: 'eastus2',
          embed: {
            model: 'multilingual-e5-large',
            fieldMap: { text: 'text' },
          },
          readCapacity: {
            mode: 'Dedicated',
            dedicated: {
              nodeType: 'b1',
              scaling: 'Manual',
              manual: { replicas: 1, shards: 1 },
            },
          },
        },
        xPineconeApiVersion: '2025-10',
      });
    });
  });

  describe('createIndexForModel readCapacity validation', () => {
    test('throws error for invalid readCapacity mode', async () => {
      const MIA = setupCreateIndexForModelResponse(undefined, undefined);

      try {
        await createIndexForModel(MIA)({
          name: 'test-index',
          cloud: 'aws',
          region: 'us-east-1',
          embed: {
            model: 'multilingual-e5-large',
            fieldMap: { text: 'text' },
          },
          // @ts-ignore
          readCapacity: { mode: 'BadMode' },
        });
        fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(PineconeArgumentError);
        expect((err as PineconeArgumentError).message).toMatch(
          /Invalid read capacity mode/i
        );
      }
    });

    test('throws error for invalid dedicated nodeType', async () => {
      const MIA = setupCreateIndexForModelResponse(undefined, undefined);

      try {
        await createIndexForModel(MIA)({
          name: 'test-index',
          cloud: 'aws',
          region: 'us-east-1',
          embed: {
            model: 'multilingual-e5-large',
            fieldMap: { text: 'text' },
          },
          readCapacity: {
            // @ts-ignore
            nodeType: 'x99',
            manual: { replicas: 1, shards: 1 },
          },
        });
        fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(PineconeArgumentError);
        expect((err as PineconeArgumentError).message).toMatch(
          /Invalid node type.*b1.*t1/i
        );
      }
    });

    test('throws error for missing manual config', async () => {
      const MIA = setupCreateIndexForModelResponse(undefined, undefined);

      try {
        await createIndexForModel(MIA)({
          name: 'test-index',
          cloud: 'aws',
          region: 'us-east-1',
          embed: {
            model: 'multilingual-e5-large',
            fieldMap: { text: 'text' },
          },
          // @ts-ignore
          readCapacity: { nodeType: 'b1' },
        });
        fail('Should have thrown an error');
      } catch (err) {
        expect(err).toBeInstanceOf(PineconeArgumentError);
        expect((err as PineconeArgumentError).message).toMatch(
          /manual is required for dedicated mode/i
        );
      }
    });
  });

  describe('createIndexForModel with waitUntilReady', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });
    afterEach(() => {
      jest.useRealTimers();
    });

    test('polls describeIndex when waitUntilReady is true', async () => {
      const MIA = setupCreateIndexForModelResponse(
        { name: 'test-index' },
        { status: { ready: true, state: 'Ready' } }
      );

      const returned = await createIndexForModel(MIA)({
        name: 'test-index',
        cloud: 'aws',
        region: 'us-east-1',
        embed: {
          model: 'multilingual-e5-large',
          fieldMap: { text: 'text' },
        },
        waitUntilReady: true,
      });

      expect(returned).toEqual({ status: { ready: true, state: 'Ready' } });
      expect(MIA.describeIndex).toHaveBeenCalledWith({
        indexName: 'test-index',
        xPineconeApiVersion: '2025-10',
      });
    });
  });
});
