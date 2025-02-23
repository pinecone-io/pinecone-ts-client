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
import { waitUntilIndexIsReady } from '../createIndex';

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
});
