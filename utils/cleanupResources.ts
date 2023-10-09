var dotenv = require('dotenv');
dotenv.config();

for (const envVar of ['PINECONE_ENVIRONMENT', 'PINECONE_API_KEY']) {
  if (!process.env[envVar]) {
    console.warn(`WARNING Missing environment variable ${envVar} in .env file`);
  } else {
    console.log(`INFO Found environment variable ${envVar} in .env file`);
  }
}

var pinecone = require('../dist');

(async () => {
  const p = new pinecone.Pinecone();
  
  const collections = await p.listCollections();
  for (const collection of collections) {
    await p.deleteCollection(collection.name)
  }

  const indexes = await p.listIndexes();
  for (const index of indexes) {
    await p.deleteIndex(index.name)
  }
})()
