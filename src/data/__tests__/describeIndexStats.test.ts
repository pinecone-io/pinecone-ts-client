import { describeIndexStats } from '../describeIndexStats';
import { DataPlaneApi } from '../../pinecone-generated-ts-fetch/data';
import { DataOperationsProvider } from '../dataOperationsProvider';
import type { DescribeIndexStatsOperationRequest } from '../../pinecone-generated-ts-fetch/data';

const setupResponse = (response, isSuccess) => {
  const fakeDescribeIndexStats: (
    req: DescribeIndexStatsOperationRequest
  ) => Promise<object> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response)
    );
  const DPA = {
    describeIndexStats: fakeDescribeIndexStats,
  } as DataPlaneApi;
  const DataProvider = { provide: async () => DPA } as DataOperationsProvider;
  return { DPA, DataProvider };
};
const setupSuccess = (response) => {
  return setupResponse(response, true);
};

describe('describeIndexStats', () => {
  test('calls the openapi describe_index_stats endpoint passing filter if provided', async () => {
    const { DPA, DataProvider } = setupSuccess({
      namespaces: {
        '': { vectorCount: 50 },
      },
      dimension: 1586,
      indexFullness: 0,
      totalVectorCount: 50,
    });

    const describeIndexStatsFn = describeIndexStats(DataProvider);
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
    expect(DPA.describeIndexStats).toHaveBeenCalledWith({
      describeIndexStatsRequest: { filter: { genre: 'classical' } },
    });
  });
});
