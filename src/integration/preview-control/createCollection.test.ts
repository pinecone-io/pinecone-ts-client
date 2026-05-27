import { Pinecone } from '../../index';
import { randomName } from '../test-helpers';

let pc: Pinecone;

beforeAll(() => {
  pc = new Pinecone();
});

describe('preview createCollection', () => {
  const indexName = process.env.PINECONE_COLLECTION_SOURCE_INDEX;

  (indexName ? test : test.skip)(
    'creates a collection and it appears in listCollections (requires PINECONE_COLLECTION_SOURCE_INDEX)',
    async () => {
      const name = randomName('preview-col');
      const result = await pc.preview.indexes.createCollection({
        name,
        source: indexName!, // because of the ternary, indexName should not be undefined here
      });

      expect(result.name).toEqual(name);
      expect(result.status).toEqual('Initializing');
    },
  );
});
