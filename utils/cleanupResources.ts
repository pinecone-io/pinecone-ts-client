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

// Helper function to safely delete a resource with error handling
async function safeDelete(
  deleteOperation: () => Promise<any>,
  resourceType: string,
  resourceName: string
): Promise<void> {
  try {
    await deleteOperation();
    console.log(`✓ Successfully deleted ${resourceType} ${resourceName}`);
  } catch (error) {
    console.error(
      `✗ Failed to delete ${resourceType} ${resourceName}:`,
      error instanceof Error ? error.message : String(error)
    );
  }
}

(async () => {
  const p = new pinecone.Pinecone();

  // Delete collections
  console.log('\n--- Cleaning up collections ---');
  const collectionList = await p.listCollections();
  if (collectionList.collections) {
    for (const collection of collectionList.collections) {
      console.log(`Attempting to delete collection ${collection.name}...`);
      await safeDelete(
        () => p.deleteCollection(collection.name),
        'collection',
        collection.name
      );
    }
  } else {
    console.log('No collections found to delete');
  }

  // Delete indexes
  console.log('\n--- Cleaning up indexes ---');
  const response = await p.listIndexes();
  if (response.indexes) {
    for (const index of response.indexes) {
      console.log(`Processing index ${index.name}...`);

      if (index.deletionProtection === 'enabled') {
        console.log(
          `Changing deletionProtection status for index ${index.name}...`
        );
        try {
          await p.configureIndex(index.name, {
            deletionProtection: 'disabled',
          });
          console.log(
            `✓ Successfully disabled deletion protection for index ${index.name}`
          );

          // Wait for the configuration change to take effect
          console.log(
            'Waiting 5 seconds for deletion protection change to take effect...'
          );
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (error) {
          console.error(
            `✗ Failed to disable deletion protection for index ${index.name}:`,
            error instanceof Error ? error.message : String(error)
          );
          continue; // Skip this index if we can't disable deletion protection
        }
      }

      await safeDelete(() => p.deleteIndex(index.name), 'index', index.name);
    }
  } else {
    console.log('No indexes found to delete');
  }

  // Delete assistants
  console.log('\n--- Cleaning up assistants ---');
  const assistants = await p.listAssistants();
  if (assistants.assistants.length > 0) {
    for (const assistant of assistants.assistants) {
      console.log(`Attempting to delete assistant ${assistant.name}...`);
      await safeDelete(
        () => p.deleteAssistant(assistant.name),
        'assistant',
        assistant.name
      );
    }
  } else {
    console.log('No assistants found to delete');
  }

  // Delete backups
  console.log('\n--- Cleaning up backups ---');
  const backups = await p.listBackups();
  if (backups.data.length > 0) {
    for (const backup of backups.data) {
      console.log(`Attempting to delete backup ${backup.name}...`);
      await safeDelete(
        () => p.deleteBackup(backup.backupId),
        'backup',
        backup.name
      );
    }
  } else {
    console.log('No backups found to delete');
  }

  console.log('\n--- Cleanup process completed ---');
  process.exit(0);
})().catch((error) => {
  console.error(
    'Fatal error during cleanup process:',
    error instanceof Error ? error.message : String(error)
  );
  process.exit(1);
});
