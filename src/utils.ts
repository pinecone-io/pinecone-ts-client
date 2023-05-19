import { PineconeClient } from ".";
import { IndexMeta, Vector, VectorOperationsApi } from "./pinecone-generated-ts-fetch";

const waitUntilIndexIsReady = async (client: PineconeClient, indexName: string, retries: number = 0) => {
  try {
    let indexDescription: IndexMeta = await client.describeIndex({ indexName })
    if (!indexDescription.status?.ready) {
      await new Promise((r) => setTimeout(r, 1000));
      await waitUntilIndexIsReady(client, indexName, retries + 1)
    }
    else {
      console.log(`Index ready after ${retries} seconds`)
      return
    }
  } catch (e) {
    console.error('Error waiting until index is ready', e)
  }
}

const createIndexIfNotExists = async (
  client: PineconeClient,
  indexName: string,
  dimension: number
) => {
  try {
    const indexList = await client.listIndexes();
    if (!indexList.includes(indexName)) {
      console.log("Creating index", indexName);
      await client.createIndex({
        createRequest: {
          name: indexName,
          dimension,
        },
      });
      console.log("Waiting until index is ready...");
      await waitUntilIndexIsReady(client, indexName);
      console.log("Index is ready.");
    }
  } catch (e) {
    console.error("Error creating index", e);
  }
};

const sliceIntoChunks = <T>(arr: T[], chunkSize: number) => {
  return Array.from({ length: Math.ceil(arr.length / chunkSize) }, (_, i) =>
    arr.slice(i * chunkSize, (i + 1) * chunkSize)
  );
};

// Upserts vectors into the index in chunks
const chunkedUpsert = async (
  index: VectorOperationsApi,
  vectors: Vector[],
  namespace: string,
  chunkSize = 10
) => {
  // Split the vectors into chunks
  const chunks = sliceIntoChunks<Vector>(vectors, chunkSize);

  try {
    // Upsert each chunk of vectors into the index
    await Promise.allSettled(
      chunks.map(async (chunk) => {
        try {
          await index.upsert({
            upsertRequest: {
              vectors: chunk as Vector[],
              namespace,
            },
          });
        } catch (e) {
          console.log("Error upserting chunk", e);
        }
      })
    );

    return true;
  } catch (e) {
    throw new Error(`Error upserting vectors into index: ${e}`);
  }
};


const utils = {
  createIndexIfNotExists,
  chunkedUpsert
}

export { utils }