import { SparseValues } from './../dist/pinecone-generated-ts-fetch/models/SparseValues';
import { PineconeClient } from '../dist';
import { IndexMeta, Vector } from '../dist/pinecone-generated-ts-fetch';

export const generateVectors = (
  dimension: number,
  quantity: number,
  withSparseValues?: boolean
): Vector[] => {
  const vectors: Vector[] = [];
  for (let i = 0; i < quantity; i++) {
    const values: number[] = [];
    for (let j = 0; j < dimension; j++) {
      values.push(Math.random());
    }
    let vector: Vector = {
      id: i.toString(),
      values,
    };
    if (withSparseValues) {
      vector = {
        ...vector,
        sparseValues: generateSparseValues(dimension),
      };
    }

    vectors.push(vector);
  }
  return vectors;
};

export const generateSparseValues = (dimension: number): SparseValues => {
  const values: number[] = [];
  const indecies: number[] = [];
  for (let j = 0; j < dimension; j++) {
    values.push(Math.random());
    indecies.push(j);
  }
  const sparseValues: SparseValues = {
    indices: indecies,
    values: values,
  };
  return sparseValues;
};

export const getRandomVector = (vectors: Vector[]) => {
  return vectors[Math.floor(Math.random() * vectors.length)];
};

export const waitUntilIndexIsTerminated = async (
  client: PineconeClient,
  indexName: string
) => {
  let indexDescription: IndexMeta;
  try {
    indexDescription = await client.describeIndex({ indexName });
  } catch (error) {
    // If index wasn't found, describe will error and we assume it is terminated
    return;
  }

  if (indexDescription.status?.state === 'Terminating') {
    await new Promise((r) => setTimeout(r, 1000));
    await waitUntilIndexIsTerminated(client, indexName);
  } else {
    return;
  }
};

export const waitUntilCollectionIsReady = async (
  client: PineconeClient,
  collectionName: string
) => {
  try {
    let collectionDescription = await client.describeCollection({
      collectionName,
    });
    if (!(collectionDescription.status === 'Ready')) {
      await new Promise((r) => setTimeout(r, 1000));
      await waitUntilCollectionIsReady(client, collectionName);
    } else {
      return;
    }
  } catch (e) {
    console.error('Error waiting until collection is ready', e);
  }
};

export const waitUntilCollectionIsTerminated = async (
  client: PineconeClient,
  collectionName: string
) => {
  let collectionDescription;
  try {
    collectionDescription = await client.describeCollection({ collectionName });
  } catch (error) {
    return;
  }
  if (collectionDescription.status === 'Terminating') {
    await new Promise((r) => setTimeout(r, 1000));
    await waitUntilCollectionIsTerminated(client, collectionName);
  } else {
    return;
  }
};

export const cleanupEverything = async (client: PineconeClient) => {
  // Delete all indexes and collections
  const listIndexes = await client.listIndexes();
  for (const index of listIndexes) {
    await client.deleteIndex({ indexName: index });
    await waitUntilIndexIsTerminated(client, index);
  }
  const listCollections = await client.listCollections();
  for (const collection of listCollections) {
    await client.deleteCollection({ collectionName: collection });
    await waitUntilCollectionIsTerminated(client, collection);
  }
};
