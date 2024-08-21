import dotenv from 'dotenv';
import pinecone from '../dist/index.js';

dotenv.config();

for (const envVar of ['PINECONE_API_KEY']) {
  if (!process.env[envVar]) {
    console.warn(`WARNING Missing environment variable ${envVar} in .env file`);
  } else {
    console.log(`INFO Found environment variable ${envVar} in .env file`);
  }
}

(async () => {
  const p = new pinecone.Pinecone();

  const collectionList = await p.listCollections();
  if (collectionList.collections) {
    for (const collection of collectionList.collections) {
      console.log(`Deleting collection ${collection.name}`);
      await p.deleteCollection(collection.name);
    }
  } else {
    console.log('No collections found to delete');
  }

  const response = await p.listIndexes();
  if (response.indexes) {
    for (const index of response.indexes) {
      console.log(`Deleting index ${index.name}`);
      await p.deleteIndex(index.name);
    }
  } else {
    console.log('No indexes found to delete');
  }

  process.exit();
})();
