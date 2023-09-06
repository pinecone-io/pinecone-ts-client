import { describeIndexStats } from '../describeIndexStats';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import { VectorOperationsProvider } from '../vectorOperationsProvider';
import type { DescribeIndexStatsOperationRequest } from '../../pinecone-generated-ts-fetch';

const setupResponse = (response, isSuccess) => {
  const fakeDescribeIndexStats: (
    req: DescribeIndexStatsOperationRequest
  ) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject({ response })
    );
  const VOA = {
    describeIndexStats: fakeDescribeIndexStats,
  } as VectorOperationsApi;
  const VoaProvider = { provide: async () => VOA } as VectorOperationsProvider;
  return { VOA, VoaProvider };
};
const setupSuccess = (response) => {
  return setupResponse(response, true);
};
const setupFailure = (response) => {
  return setupResponse(response, false);
};

describe('describeIndexStats', () => {
  test('calls the openapi describe_index_stats endpoint passing filter if provided', async () => {
    const { VOA, VoaProvider } = setupSuccess({
      namespaces: {
        '': { vectorCount: 50 },
      },
      dimension: 1586,
      indexFullness: 0,
      totalVectorCount: 50,
    });

    const describeIndexStatsFn = describeIndexStats(VoaProvider);
    const returned = await describeIndexStatsFn({
      filter: { genre: 'classical' },
    });

    // Maps response to from "vector" to "record" terminology
    expect(returned).toEqual({
      namespaces: {
        '': { recordCount: 50 },
      },
      dimension: 1586,
      indexFullness: 0,
      totalRecordCount: 50,
    });
    expect(VOA.describeIndexStats).toHaveBeenCalledWith({
      describeIndexStatsRequest: { filter: { genre: 'classical' } },
    });
  });

  describe('http error mapping', () => {
    test('when 500 occurs', async () => {
      const { VoaProvider } = setupFailure({
        status: 500,
        text: () => 'backend error message',
      });
      const toThrow = async () => {
        const describeIndexStatsFn = describeIndexStats(VoaProvider);
        await describeIndexStatsFn({ filter: { genre: 'classical' } });
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const serverError = 'there has been a server error!';
      const { VoaProvider } = setupFailure({
        status: 400,
        text: () => serverError,
      });

      const toThrow = async () => {
        const describeIndexStatsFn = describeIndexStats(VoaProvider);
        await describeIndexStatsFn({ filter: { genre: 'classical' } });
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow(serverError);
    });
  });
});
