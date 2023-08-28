import { describeIndexStats } from '../describeIndexStats';
import {
  PineconeBadRequestError,
  PineconeInternalServerError,
} from '../../errors';
import { VectorOperationsApi } from '../../pinecone-generated-ts-fetch';
import type { DescribeIndexStatsOperationRequest } from '../../pinecone-generated-ts-fetch';

describe('describeIndexStats', () => {
  test('calls the openapi describe_index_stats endpoint passing filter if provided', async () => {
    const fakeDescribeIndexStats: (
      req: DescribeIndexStatsOperationRequest
    ) => Promise<object> = jest.fn();
    const VOA = {
      describeIndexStats: fakeDescribeIndexStats,
    } as VectorOperationsApi;

    jest.mock('../../pinecone-generated-ts-fetch', () => ({
      VectorOperationsApi: VOA,
    }));

    const describeIndexStatsFn = describeIndexStats(VOA);
    const returned = await describeIndexStatsFn({
      filter: { genre: 'classical' },
    });

    expect(returned).toBe(void 0);
    expect(VOA.describeIndexStats).toHaveBeenCalledWith({
      describeIndexStatsRequest: { filter: { genre: 'classical' } },
    });
  });

  describe('http error mapping', () => {
    test('when 500 occurs', async () => {
      const fakeDescribeIndexStats: (
        req: DescribeIndexStatsOperationRequest
      ) => Promise<object> = jest.fn().mockImplementation(() =>
        Promise.reject({
          response: { status: 500, text: () => 'backend error message' },
        })
      );

      const VOA = {
        describeIndexStats: fakeDescribeIndexStats,
      } as VectorOperationsApi;
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        VectorOperationsApi: VOA,
      }));

      const toThrow = async () => {
        const describeIndexStatsFn = describeIndexStats(VOA);
        await describeIndexStatsFn({ filter: { genre: 'classical' } });
      };

      await expect(toThrow).rejects.toThrow(PineconeInternalServerError);
    });

    test('when 400 occurs, displays server message', async () => {
      const serverError = 'there has been a server error!';
      const fakeDescribeIndexStats: (
        req: DescribeIndexStatsOperationRequest
      ) => Promise<object> = jest
        .fn()
        .mockImplementation(() =>
          Promise.reject({ response: { status: 400, text: () => serverError } })
        );

      const VOA = {
        describeIndexStats: fakeDescribeIndexStats,
      } as VectorOperationsApi;
      jest.mock('../../pinecone-generated-ts-fetch', () => ({
        VectorOperationsApi: VOA,
      }));

      const toThrow = async () => {
        const describeIndexStatsFn = describeIndexStats(VOA);
        await describeIndexStatsFn({ filter: { genre: 'classical' } });
      };

      await expect(toThrow).rejects.toThrow(PineconeBadRequestError);
      await expect(toThrow).rejects.toThrow(serverError);
    });
  });
});
