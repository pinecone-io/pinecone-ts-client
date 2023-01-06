// Test for the pinecone-client-ts

import { PineconeClient } from '../src/index'
import { QueryRequest, CreateRequest, UpdateRequest, DeleteRequest, UpsertRequest, Vector, QueryVector } from '../src/pinecone-generated-ts'
import { afterAll, beforeAll, describe, expect, test } from '@jest/globals';
import { uniqueNamesGenerator, adjectives, colors, animals } from 'unique-names-generator';


const apiKey = '4d8a2ff9-7a77-4316-870e-0b2f7a2a90ef'
const index = 'elastic-small'
const environment = 'us-west1-gcp'

jest.useRealTimers();

const generateVectors = (dimension: number, quantity: number): Vector[] => {
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

const getRandomVector = (vectors: Vector[]) => {
  return vectors[Math.floor(Math.random() * vectors.length)]
}


// const indexName = uniqueNamesGenerator({
//   dictionaries: [colors, adjectives, animals],
//   separator: '-',
// });

const indexName = "test"
const namespace = "test-namespace"
const dimension = 10
const vectors = generateVectors(dimension, 100)


// describe('Pinecone Client Control Plane operations', () => {
//   const client: PineconeClient = new PineconeClient()

//   beforeEach(() => {
//     jest.setTimeout(100000)
//   })

//   beforeAll(async () => {
//     const configuration = {
//       environment,
//       apiKey
//     }
//     await client.init(configuration)
//   })

//   it ('should create index', async () => {
//     await client.
//   })

// })

describe('Pinecone Client Index Operations', () => {
  const client: PineconeClient = new PineconeClient()
  beforeEach(() => {
    jest.setTimeout(100000)
  })

  beforeAll(async () => {
    const configuration = {
      environment,
      apiKey
    }


    await client.init(configuration)


  })

  it('should create index', async () => {
    const createRequest: CreateRequest = {
      name: indexName,
      dimension,
      metric: 'cosine',
    }

    await client.createIndex(createRequest)
    await new Promise((r) => setTimeout(r, 90000));
    const list = await client.listIndexes()
    expect(list.data).toContain(indexName)

  })

  it('created index should be listed', async () => {
    const list = await client.listIndexes()
    expect(list.data).toContain(indexName)
  })

  it('should be able to upsert a vector', async () => {
    const index = client.Index(indexName)
    const upsertRequest: UpsertRequest = {
      vectors
    }
    await index.upsert(upsertRequest)

    const queryRequest: QueryRequest = {
      topK: 1,
      vector: getRandomVector(vectors).values,
      namespace
    }

    const queryResponse = await index.query(queryRequest)
    expect(queryResponse?.data?.matches?.length).toBeGreaterThan(0)

  })

  it('should be able to query a vector', async () => {
    const index = client.Index(indexName)
    const queryRequest: QueryRequest = {
      topK: 1,
      vector: getRandomVector(vectors).values
    }

    const queryResponse = await index.query(queryRequest)
    expect(queryResponse?.data?.matches?.length).toBeGreaterThan(0)
  })

  it('should be able to update a vector', async () => {
    const index = client.Index(indexName)

  })

  it('should be able to describe index stats', async () => {
    const index = client.Index(indexName)
  })

  it('should be able to fetch vectors by ID', async () => {
    const index = client.Index(indexName)
    const randomVectorId = getRandomVector(vectors).id
    const fetchResult = await index.fetch([randomVectorId])
    expect(Object.keys(fetchResult.data.vectors as object)).toContain(randomVectorId)
  })

  it('should be able to delete a vector', async () => {
    const randomVectorId = getRandomVector(vectors).id
    const index = client.Index(indexName)
    await index.delete1([randomVectorId])
    const fetchResult = await index.fetch([randomVectorId])
    expect(Object.keys(fetchResult.data.vectors as object).length).toBe(0)
  })

  it('should be able to delete a namespace', async () => {

  })

  it('should be able to delete an index', async () => {
    await client.deleteIndex(indexName)
    const list = await client.listIndexes()
    expect(list.data).not.toContain(indexName)
  })
})


