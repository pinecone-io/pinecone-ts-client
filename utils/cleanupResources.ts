var dotenv = require('dotenv');
dotenv.config();

for (const envVar of ['PINECONE_API_KEY']) {
  if (!process.env[envVar]) {
    console.warn(`WARNING Missing environment variable ${envVar} in .env file`);
  } else {
    console.log(`INFO Found environment variable ${envVar} in .env file`);
  }
}

var pinecone = require('../dist');

(async () => {
  const p = new pinecone.Pinecone();

  // TODO: Uncomment when collections are supported
  // const collections = await p.listCollections();
  // for (const collection of collections) {
  //   console.log(`Deleting collection ${collection.name}`);
  //   await p.deleteCollection(collection.name);
  // }

  const indexes = await p.listIndexes();
  for (const index of indexes) {
    console.log(`Deleting index ${index.name}`);
    await p.deleteIndex(index.name);
  }
})();
