import { Pinecone } from '@pinecone-database/pinecone';

const p = new Pinecone();

(async () => {
  const indexList = await p.indexes.list();
  console.log(`Available indexes: ${JSON.stringify(indexList)}`);

  await p.indexes.createForModel({
    name: 'compilation-test',
    cloud: 'aws',
    region: 'us-east-1',
    embed: {
      model: 'multilingual-e5-large',
      fieldMap: { text: 'chunk_text' },
    },
  });

  const ns = await p.index('compilation-test').describeNamespace('ns-1');
  const recordCount: string | undefined = ns.recordCount;
  console.log(`Records: ${recordCount}`);
})();
