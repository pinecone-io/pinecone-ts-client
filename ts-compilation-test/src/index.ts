import { Pinecone } from '@pinecone-database/pinecone';

const p = new Pinecone();

(async () => {
  const indexList = await p.indexes.list();
  console.log(`Available indexes: ${JSON.stringify(indexList)}`);
})();
