import { QueryCommand } from '../query';
import { PineconeArgumentError } from '../../errors';
import { DataOperationsProvider } from '../dataOperationsProvider';
import { PineconeConfiguration } from '../types';

jest.mock('../dataOperationsProvider');
jest.mock('../types');

describe('Query command tests', () => {
  let apiProvider: DataOperationsProvider;
  let pineconeConfig: PineconeConfiguration;

  beforeEach(() => {
    apiProvider = new DataOperationsProvider(pineconeConfig, 'index-name');
    (apiProvider.provide as jest.Mock).mockResolvedValue({
      query: jest.fn().mockResolvedValue({ matches: [] }),
    });
  });

  test('should throw error when known property is misspelled', async () => {
    const queryCommand = new QueryCommand(apiProvider, 'test-namespace');

    await expect(
      // @ts-ignore
      queryCommand.run({ id: 'abc', topK: 2, includeMetadataaaaa: true })
    ).rejects.toThrow(PineconeArgumentError);

    await expect(
      // @ts-ignore
      queryCommand.run({ id: 'abc', topK: 2, includeMetadataaaaa: true })
    ).rejects.toThrow(
      'Object contained invalid properties: includeMetadataaaaa. Valid properties include id, vector, sparseVector,' +
        ' includeValues, includeMetadata, filter, topK.'
    );
  });

  test('should throw error when no options obj is passed', async () => {
    const queryCommand = new QueryCommand(apiProvider, 'test-namespace');
    // @ts-ignore
    await expect(queryCommand.run()).rejects.toThrow(PineconeArgumentError);
    // @ts-ignore
    await expect(queryCommand.run()).rejects.toThrow(
      'You must enter a query configuration object to query the index.'
    );
  });

  test('should throw error when topK is not passed', async () => {
    const queryCommand = new QueryCommand(apiProvider, 'test-namespace');
    // @ts-ignore
    await expect(queryCommand.run({})).rejects.toThrow(PineconeArgumentError);
    // @ts-ignore
    await expect(queryCommand.run({})).rejects.toThrow(
      'You must enter an integer for the `topK` search results to be returned.'
    );
  });

  test('should throw error when topK is negative', async () => {
    const queryCommand = new QueryCommand(apiProvider, 'test-namespace');
    await expect(
      queryCommand.run({ id: 'some-id', topK: -100 })
    ).rejects.toThrow('`topK` field must be greater than 0.');
    await expect(
      queryCommand.run({ id: 'some-id', topK: -100 })
    ).rejects.toThrow(PineconeArgumentError);
  });

  test('should throw error when filter is empty', async () => {
    const queryCommand = new QueryCommand(apiProvider, 'test-namespace');
    await expect(
      queryCommand.run({ id: 'some-id', topK: 1, filter: {} })
    ).rejects.toThrow(
      'You must enter a filter object with at least one key-value pair.'
    );
    await expect(
      queryCommand.run({ id: 'some-id', topK: 1, filter: {} })
    ).rejects.toThrow(PineconeArgumentError);
  });

  test('should throw error when id is blank string', async () => {
    const queryCommand = new QueryCommand(apiProvider, 'test-namespace');
    await expect(queryCommand.run({ id: '', topK: 1 })).rejects.toThrow(
      'You must enter non-empty string for recordID to query by record ID.'
    );
    await expect(queryCommand.run({ id: '', topK: 1 })).rejects.toThrow(
      PineconeArgumentError
    );
  });

  test('should throw error when vector is empty array', async () => {
    const queryCommand = new QueryCommand(apiProvider, 'test-namespace');
    await expect(queryCommand.run({ vector: [], topK: 1 })).rejects.toThrow(
      'You must enter an Array of RecordValues to query by vector values.'
    );
    await expect(queryCommand.run({ vector: [], topK: 1 })).rejects.toThrow(
      PineconeArgumentError
    );
  });

  test('should throw error when sparseVector indices or values is empty array', async () => {
    const queryCommand = new QueryCommand(apiProvider, 'test-namespace');
    // Missing indices
    await expect(
      queryCommand.run({
        vector: [0.2, 0.1],
        topK: 1,
        sparseVector: { indices: [], values: [0.1, 0.2] },
      })
    ).rejects.toThrow(
      'You must enter a RecordSparseValues object with indices and values in order to query by sparse' +
        ' vector values.'
    );
    await expect(
      queryCommand.run({
        vector: [0.2, 0.1],
        topK: 1,
        sparseVector: { indices: [], values: [0.1, 0.2] },
      })
    ).rejects.toThrow(PineconeArgumentError);

    // Missing values
    await expect(
      queryCommand.run({
        vector: [0.2, 0.1],
        topK: 1,
        sparseVector: { indices: [0.1, 0.2], values: [] },
      })
    ).rejects.toThrow(
      'You must enter a RecordSparseValues object with indices and values in order to query by sparse' +
        ' vector values.'
    );
    await expect(
      queryCommand.run({
        vector: [0.2, 0.1],
        topK: 1,
        sparseVector: { indices: [0.1, 0.2], values: [] },
      })
    ).rejects.toThrow(PineconeArgumentError);

    // Missing both indices and values
    await expect(
      queryCommand.run({
        vector: [0.2, 0.1],
        topK: 1,
        sparseVector: { indices: [], values: [] },
      })
    ).rejects.toThrow(
      'You must enter a RecordSparseValues object with indices and values in order to query by sparse' +
        ' vector values.'
    );
    await expect(
      queryCommand.run({
        vector: [0.2, 0.1],
        topK: 1,
        sparseVector: { indices: [], values: [] },
      })
    ).rejects.toThrow(PineconeArgumentError);
  });
});
