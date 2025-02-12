const dotenv = require('dotenv');

const pinecone = require('../dist');

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
  }

  const response = await p.listIndexes();
  if (response.indexes) {
    for (const index of response.indexes) {
      if (index.deletionProtection === 'enabled') {
        console.log(
          'Changing deletionProtection status for index...',
          index.name
        );
        await p.configureIndex(index.name, { deletionProtection: 'disabled' });
        console.log(`Deleting index ${index.name}...`);
        await p.deleteIndex(index.name);
      } else {
        console.log(`Deleting index ${index.name}`);
        await p.deleteIndex(index.name);
      }
    }
  }

  const assistants = await p.listAssistants();
  if (assistants.assistants.length > 0) {
    for (const assistant of assistants.assistants) {
      console.log(`Deleting assistant ${assistant.name}`);
      await p.deleteAssistant(assistant.name);
    }
  }
  process.exit();
})();
