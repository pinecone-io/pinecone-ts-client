import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview deleteIndex', () => {
  test('deletes an existing alpha index', async () => {
    const indexName = randomName('preview-del');
    await pc.preview.indexes.createIndex({
      name: indexName,
      schema: {
        fields: {
          chunk_text: { type: 'string', full_text_search: {} },
        },
      },
      waitUntilReady: true,
    });
    // Should resolve without error
    await pc.preview.indexes.deleteIndex(indexName);
  });

  test('throws on deleting a non-existent index', async () => {
    await expect(
      pc.preview.indexes.deleteIndex(randomName('no-such-idx')),
    ).rejects.toThrow();
  });
});
