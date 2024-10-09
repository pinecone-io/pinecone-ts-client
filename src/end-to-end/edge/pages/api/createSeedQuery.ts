// Hit endpoint by sending cURL request like this (after spinning up the server: `next dev`):
// curl --location 'http://localhost:3000/api/createSeedQuery'

import type { NextApiRequest, NextApiResponse } from 'next';
import { Pinecone } from '@pinecone-database/pinecone';
import { generateRecords, randomIndexName, sleep } from '../../helpers/helpers';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error('Pinecone API key is required');
    }

    const apiKey = process.env.PINECONE_API_KEY;
    const pinecone = new Pinecone({ apiKey });

    // Step 1: Generate a unique index name
    const indexName = randomIndexName('e2eTestIndex');

    // Step 2: Check if index exists by listing indexes and searching by name
    const existingIndexes = await pinecone.listIndexes();
    const indexExists = existingIndexes.indexes.some(
      (index) => index.name === indexName
    );

    // Create serverless index
    if (!indexExists) {
      await pinecone.createIndex({
        name: indexName,
        dimension: 2,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-west-2',
          },
        },
        waitUntilReady: true,
      });
    }

    // Step 3: Check if index is empty, seed data if necessary
    const index = pinecone.Index(indexName);
    const stats = await index.describeIndexStats();
    if (stats.totalRecordCount === 0) {
      console.log('Index is empty; seeding data into the index...');
      const records = generateRecords({
        dimension: 2,
        quantity: 3,
        prefix: 'testRecord',
        withSparseValues: true,
        withMetadata: true,
      });
      await index.upsert(records);
    }

    // Step 4: Query the index to verify data
    console.log('Index name =', await index.describeIndexStats());
    await sleep(5000);
    const queryResponse = await index.query({
      topK: 1,
      vector: [0.236, 0.971],
    });
    console.log('Query response =', queryResponse);

    // Send the query results back
    res.status(200).json({ queryResult: queryResponse });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
