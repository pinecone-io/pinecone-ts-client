import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview configureIndex', () => {
  test('updates deletion_protection on an existing index', async () => {
    const indexName = randomName('preview-cfg');
    await pc.preview.indexes.createIndex({
      name: indexName,
      schema: {
        fields: {
          chunk_text: { type: 'string', full_text_search: {} },
        },
      },
      waitUntilReady: true,
    });

    const updated = await pc.preview.indexes.configureIndex(indexName, {
      deletion_protection: 'enabled',
    });
    expect(updated.deletion_protection).toBe('enabled');

    // Disable protection before deletion
    await pc.preview.indexes.configureIndex(indexName, {
      deletion_protection: 'disabled',
    });
    await pc.preview.indexes.deleteIndex(indexName);
  });

  test('throws on configuring a non-existent index', async () => {
    await expect(
      pc.preview.indexes.configureIndex(randomName('no-such-idx'), {
        deletion_protection: 'enabled',
      }),
    ).rejects.toThrow();
  });
});
