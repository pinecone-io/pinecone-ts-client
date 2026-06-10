import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview deleteIndex', () => {
  test('deletes an existing alpha index', async () => {
    const indexName = randomName('preview-del');
    await pc.preview.indexes.create({
      name: indexName,
      schema: {
        fields: {
          chunk_text: { type: 'string', fullTextSearch: {} },
        },
      },
      waitUntilReady: true,
    });
    // Should resolve without error
    await pc.preview.indexes.delete(indexName);
  });

  test('throws on deleting a non-existent index', async () => {
    await expect(
      pc.preview.indexes.delete(randomName('no-such-idx')),
    ).rejects.toThrow();
  });
});
