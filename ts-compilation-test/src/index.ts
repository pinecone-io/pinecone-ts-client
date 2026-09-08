import { Pinecone } from '@pinecone-database/pinecone';

const p = new Pinecone();

(async () => {
  const indexList = await p.indexes.list();
  console.log(`Available indexes: ${JSON.stringify(indexList)}`);
})();

// CI runs `npm run start` on this file against the live API whenever a key is
// present, so anything that would create or mutate a resource has to stay off
// the executed path. This is never called: `tsc` still type-checks the bodies,
// which is the whole point of the fixture. Exported so `noUnusedLocals` --
// which the fixture's tsconfig enables -- does not reject it as dead.
export async function compileOnlySurfaceCoverage(): Promise<void> {
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
}
