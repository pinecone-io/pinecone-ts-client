import { describeIndexStats } from '../../vectors/describeIndexStats';
import { VectorOperationsApi as DataPlaneApi } from '../../../pinecone-generated-ts-fetch/db_data';
import { VectorOperationsProvider } from '../../vectors/vectorOperationsProvider';
import type { DescribeIndexStatsOperationRequest } from '../../../pinecone-generated-ts-fetch/db_data';
import { PineconeArgumentError } from '../../../errors';

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
  const DataProvider = { provide: async () => DPA } as VectorOperationsProvider;
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
      xPineconeApiVersion: '2025-10',
    });
  });

  test('Throws error if empty filter is provided', async () => {
    const { DataProvider } = setupSuccess({
      namespaces: {
        '': { vectorCount: 50 },
      },
      dimension: 1586,
      indexFullness: 0,
      totalVectorCount: 50,
    });
    const describeIndexStatsFn = describeIndexStats(DataProvider);
    const toThrow = async () => {
      await describeIndexStatsFn({ filter: { someKey: '' } });
    };
    await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow).rejects.toThrowError(
      '`filter` property cannot be empty'
    );
  });

  test('Throws error if known property is misspelled', async () => {
    const { DataProvider } = setupSuccess({
      namespaces: {
        '': { vectorCount: 50 },
      },
      dimension: 1586,
      indexFullness: 0,
      totalVectorCount: 50,
    });
    const describeIndexStatsFn = describeIndexStats(DataProvider);
    const toThrow = async () => {
      // @ts-ignore
      await describeIndexStatsFn({ filterasdga: { someKey: '' } });
    };
    await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow).rejects.toThrowError(
      'Object contained invalid properties: filterasdga. Valid properties include filter.'
    );
  });

  test('Throws error if unknown property is passed', async () => {
    const { DataProvider } = setupSuccess({
      namespaces: {
        '': { vectorCount: 50 },
      },
      dimension: 1586,
      indexFullness: 0,
      totalVectorCount: 50,
    });
    const describeIndexStatsFn = describeIndexStats(DataProvider);
    const toThrow = async () => {
      await describeIndexStatsFn({
        filter: { someKey: 'some-value' },
        // @ts-ignore
        test: 'test',
      });
    };
    await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
    await expect(toThrow).rejects.toThrowError(
      'Object contained invalid properties: test. Valid properties include filter.'
    );
  });
});
