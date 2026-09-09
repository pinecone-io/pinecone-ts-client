import dotenv from 'dotenv';
import { Pinecone } from '../dist';

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
  resourceName: string,
): Promise<void> {
  try {
    await deleteOperation();
    console.log(`✓ Successfully deleted ${resourceType} ${resourceName}`);
  } catch (error) {
    console.error(
      `✗ Failed to delete ${resourceType} ${resourceName}:`,
      error instanceof Error ? error.message : String(error),
    );
  }
}

(async () => {
  const p = new Pinecone();

  // Delete collections
  console.log('\n--- Cleaning up collections ---');
  const collectionList = await p.collections.list();
  if (collectionList.collections && collectionList.collections.length > 0) {
    for (const collection of collectionList.collections) {
      console.log(`Attempting to delete collection ${collection.name}...`);
      await safeDelete(
        () => p.collections.delete(collection.name),
        'collection',
        collection.name,
      );
    }
  } else {
    console.log('No collections found to delete');
  }

  // Delete indexes
  console.log('\n--- Cleaning up indexes ---');
  const response = await p.indexes.list();
  if (response.indexes && response.indexes.length > 0) {
    for (const index of response.indexes) {
      console.log(`Processing index ${index.name}...`);

      if (index.deletionProtection === 'enabled') {
        console.log(
          `Changing deletionProtection status for index ${index.name}...`,
        );
        try {
          await p.indexes.configure(index.name, {
            deletionProtection: 'disabled',
          });
          console.log(
            `✓ Successfully disabled deletion protection for index ${index.name}`,
          );

          // Wait for the configuration change to take effect
          console.log(
            'Waiting 5 seconds for deletion protection change to take effect...',
          );
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } catch (error) {
          console.error(
            `✗ Failed to disable deletion protection for index ${index.name}:`,
            error instanceof Error ? error.message : String(error),
          );
          continue; // Skip this index if we can't disable deletion protection
        }
      }

      await safeDelete(() => p.indexes.delete(index.name), 'index', index.name);
    }
  } else {
    console.log('No indexes found to delete');
  }

  // Delete assistants
  console.log('\n--- Cleaning up assistants ---');
  const assistants = await p.assistants.list();
  if (assistants.assistants && assistants.assistants.length > 0) {
    for (const assistant of assistants.assistants) {
      console.log(`Attempting to delete assistant ${assistant.name}...`);
      await safeDelete(
        () => p.assistants.delete(assistant.name),
        'assistant',
        assistant.name,
      );
    }
  } else {
    console.log('No assistants found to delete');
  }

  // Delete backups
  console.log('\n--- Cleaning up backups ---');
  const backups = await p.backups.list();
  if (backups.data && backups.data.length > 0) {
    for (const backup of backups.data) {
      console.log(
        `Attempting to delete backup ${backup.name} (ID: ${backup.backupId})...`,
      );
      await safeDelete(
        () => p.backups.delete(backup.backupId),
        'backup',
        `${backup.name} (ID: ${backup.backupId})`,
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
    error instanceof Error ? error.message : String(error),
  );
  process.exit(1);
});
