import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview createCollection', () => {
  const source = process.env.PINECONE_COLLECTION_SOURCE_INDEX;

  (source ? test : test.skip)(
    'creates a collection and it appears in listCollections (requires PINECONE_COLLECTION_SOURCE_INDEX)',
    async () => {
      const name = randomName('preview-col');
      const result = await pc.preview.indexes.createCollection({
        name,
        source: source!,
      });

      expect(result.name).toEqual(name);
      expect(result.status).toEqual('Initializing');
    },
  );
});
