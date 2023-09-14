import { Pinecone } from '@pinecone-database/pinecone';

const p = new Pinecone();

(async () => {
  const indexList = await p.listIndexes();
  console.log(`Available indexes: ${JSON.stringify(indexList)}`);
})();
