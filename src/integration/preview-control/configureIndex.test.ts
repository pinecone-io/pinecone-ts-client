import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview configureIndex', () => {
  test('updates deletionProtection on an existing index', async () => {
    const indexName = randomName('preview-cfg');
    await pc.preview.indexes.create({
      name: indexName,
      schema: {
        fields: {
          chunk_text: { type: 'string', fullTextSearch: {} },
        },
      },
      waitUntilReady: true,
    });

    const updated = await pc.preview.indexes.configure(indexName, {
      deletionProtection: 'enabled',
    });
    expect(updated.deletionProtection).toBe('enabled');

    // Disable protection before deletion
    await pc.preview.indexes.configure(indexName, {
      deletionProtection: 'disabled',
    });
    await pc.preview.indexes.delete(indexName);
  });

  test('throws on configuring a non-existent index', async () => {
    await expect(
      pc.preview.indexes.configure(randomName('no-such-idx'), {
        deletionProtection: 'enabled',
      }),
    ).rejects.toThrow();
  });
});
