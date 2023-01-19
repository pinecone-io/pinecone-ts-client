import { PineconeClient } from "../src"
import { Vector } from "../src/pinecone-generated-ts"

export const generateVectors = (dimension: number, quantity: number): Vector[] => {
  const vectors: Vector[] = []
  for (let i = 0; i < quantity; i++) {
    const values: number[] = []
    for (let j = 0; j < dimension; j++) {
      values.push(Math.random())
    }
    const vector: Vector = {
      id: i.toString(),
      values
    }
    vectors.push(vector)
  }
  return vectors
}

export const getRandomVector = (vectors: Vector[]) => {
  return vectors[Math.floor(Math.random() * vectors.length)]
}


export const waitUntilIndexIsReady = async (client: PineconeClient, indexName: string) => {
  try {
    let indexDescriptionResult = await client.describeIndex(indexName)
    let { data: indexDescription } = indexDescriptionResult
    //@ts-ignore
    if (!indexDescription.status.ready) {
      await new Promise((r) => setTimeout(r, 1000));
      await waitUntilIndexIsReady(client, indexName)
    }
    else {
      return
    }
  } catch (e) {
    console.error('Error waiting until index is ready', e)
  }
}

export const waitUntilIndexIsTerminated = async (client: PineconeClient, indexName: string) => {
  let indexDescriptionResult
  try {
    indexDescriptionResult = await client.describeIndex(indexName)
  } catch (error) {
    // If index wasn't found, describe will error and we assume it is terminated
    return
  }
  let { data: indexDescription } = indexDescriptionResult
  //@ts-ignore
  if (indexDescription.status.state === 'Terminating') {
    await new Promise((r) => setTimeout(r, 1000));
    await waitUntilIndexIsTerminated(client, indexName)
  }
  else {
    return
  }
}

export const waitUntilCollectionIsReady = async (client: PineconeClient, collectionName: string) => {
  try {
    let collectionDescriptionResult = await client.describeCollection(collectionName)
    let { data: collectionDescription } = collectionDescriptionResult
    if (!(collectionDescription.status === 'Ready')) {
      await new Promise((r) => setTimeout(r, 1000));
      await waitUntilCollectionIsReady(client, collectionName)
    }
    else {
      return
    }
  } catch (e) {
    console.error('Error waiting until collection is ready', e)
  }
}

export const waitUntilCollectionIsTerminated = async (client: PineconeClient, collectionName: string) => {
  let collectionDescriptionResult
  try {
    collectionDescriptionResult = await client.describeCollection(collectionName)
  } catch (error) {
    return
  }
  let { data: collectionDescription } = collectionDescriptionResult
  if (collectionDescription.status === 'Terminating') {
    await new Promise((r) => setTimeout(r, 1000));
    await waitUntilCollectionIsTerminated(client, collectionName)
  }
  else {
    return
  }
}