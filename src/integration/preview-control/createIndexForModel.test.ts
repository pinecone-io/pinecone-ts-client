import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview createIndexForModel', () => {
  test('creates a model-configured serverless index and cleans up', async () => {
    const indexName = randomName('preview-model');

    try {
      const result = await pc.preview.indexes.createIndexForModel({
        name: indexName,
        cloud: 'aws',
        region: 'us-east-1',
        field: 'text',
        model: 'multilingual-e5-large',
      });

      expect(result.name).toEqual(indexName);
      expect(result.status?.ready).toBe(true);
    } finally {
      await pc.preview.indexes.deleteIndex(indexName).catch(() => {});
    }
  });

  test('rejects an unknown model name', async () => {
    await expect(
      pc.preview.indexes.createIndexForModel({
        name: randomName('preview-bad-model'),
        cloud: 'aws',
        region: 'us-east-1',
        field: 'text',
        model: 'totally-unknown-model-xyz',
      }),
    ).rejects.toThrow();
  });

  test('rejects a duplicate index name', async () => {
    const indexName = randomName('preview-model-dupe');

    try {
      await pc.preview.indexes.createIndexForModel({
        name: indexName,
        cloud: 'aws',
        region: 'us-east-1',
        field: 'text',
        model: 'multilingual-e5-large',
      });

      await expect(
        pc.preview.indexes.createIndexForModel({
          name: indexName,
          cloud: 'aws',
          region: 'us-east-1',
          field: 'text',
          model: 'multilingual-e5-large',
        }),
      ).rejects.toThrow();
    } finally {
      await pc.preview.indexes.deleteIndex(indexName).catch(() => {});
    }
  });
});
