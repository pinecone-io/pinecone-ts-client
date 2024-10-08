// pages/api/getIndexes.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import { IndexList, IndexModel, Pinecone } from '@pinecone-database/pinecone';
import { jestExpect } from '@jest/expect';

// todo: pass api key

// Initialize the Pinecone client once and configure it
const pc = new Pinecone({ apiKey: 'adsf' });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<IndexList | { error: string }>
) {
  try {
    const fetchedIndexes = await pc.listIndexes();
    jestExpect(fetchedIndexes).toBeDefined();

    // Create an object of type IndexList
    const indexes: IndexList = { indexes : fetchedIndexes as IndexModel[] };

    res.status(200).json(indexes);
  } catch (error) {
    res.status(500).json(error);
  }
}
