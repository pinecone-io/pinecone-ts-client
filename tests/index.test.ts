// Test for the pinecone-client-ts-fetch package

import {
  CreateCollectionRequest,
  CreateRequest,
  IndexMeta,
  PineconeClient,
  QueryRequest,
  UpdateRequest,
  UpsertRequest,
  utils
} from '../dist'
import { afterAll, beforeAll, describe, expect } from '@jest/globals';
import { adjectives, animals, uniqueNamesGenerator } from 'unique-names-generator';
import {
  cleanupEverything,
  generateVectors,
  getRandomVector,
  waitUntilCollectionIsReady,
  waitUntilCollectionIsTerminated,
  waitUntilIndexIsTerminated
} from '../utils/helpers'
import dotenv from 'dotenv'

const { waitUntilIndexIsReady } = utils

dotenv.config()
const apiKey = process.env.PINECONE_API_KEY!
const environment = process.env.PINECONE_ENVIRONMENT!

if (!apiKey || !environment) {
  throw new Error("You must set PINECONE_API_KEY and PINECONE_ENVIRONMENT environment variables before running tests")
}

jest.useRealTimers();

const namespace = "test-namespace"
const dimensions = 10
const quantity = 10
const metric = 'dotproduct'
const vectors = generateVectors(dimensions, quantity)
const vectorsWithSparseValues = generateVectors(dimensions, quantity, true)
const client: PineconeClient = new PineconeClient()

beforeAll(async () => {
  const configuration = {
    environment,
    apiKey
  }
  await client.init(configuration)

  // Defensively clean up any resources that may have been left behind
  // by a previous test run that did not cleanup properly.
  await cleanupEverything(client)
})

describe('Pinecone javascript client', () => {
  afterAll(async () => {
    await cleanupEverything(client)
  })

  const indexName = uniqueNamesGenerator({
    dictionaries: [adjectives, animals],
    separator: '-',
  });

  it('should create index', async () => {
    const createRequest: CreateRequest = {
      name: indexName,
      dimension: dimensions,
      metric,
    }

    await client.createIndex({ createRequest })
    await waitUntilIndexIsReady(client, indexName)
    const list = await client.listIndexes()
    expect(list).toContain(indexName)
  })

  describe('Pinecone Client Index Operations', () => {
    it('should be able to upsert a vector', async () => {
      const index = client.Index(indexName)
      const upsertRequest: UpsertRequest = {
        vectors,
        namespace
      }
      await index.upsert({ upsertRequest })
      const queryRequest: QueryRequest = {
        topK: 1,
        vector: getRandomVector(vectors).values,
        namespace
      }

      const queryResponse = await index.query({ queryRequest })
      expect(queryResponse?.matches?.length).toBeGreaterThan(0)
    })

    it('should be able to upsert a vector with sparse values', async () => {
      const index = client.Index(indexName)
      const upsertRequest: UpsertRequest = {
        vectors: vectorsWithSparseValues,
        namespace
      }
      await index.upsert({ upsertRequest })
      const randomVector = getRandomVector(vectors)
      const queryRequest: QueryRequest = {
        topK: 1,
        vector: randomVector.values,
        sparseVector: randomVector.sparseValues,
        namespace
      }

      const queryResponse = await index.query({ queryRequest })
      expect(queryResponse?.matches?.length).toBeGreaterThan(0)
    })

    it('should be able to query a vector', async () => {
      const index = client.Index(indexName)
      const queryRequest: QueryRequest = {
        topK: 1,
        vector: getRandomVector(vectors).values,
        namespace
      }

      const queryResponse = await index.query({ queryRequest })
      expect(queryResponse?.matches?.length).toBeGreaterThan(0)
    })

    it('should be able to query a vector with sparse values', async () => {
      const index = client.Index(indexName)
      const randomVector = getRandomVector(vectors)
      const queryRequest: QueryRequest = {
        topK: 1,
        vector: randomVector.values,
        sparseVector: randomVector.sparseValues,
        namespace
      }

      const queryResponse = await index.query({ queryRequest })
      expect(queryResponse?.matches?.length).toBeGreaterThan(0)
    })

    it('should be able to update a vector', async () => {
      const index = client.Index(indexName)
      const updateRequest: UpdateRequest = {
        id: getRandomVector(vectors).id,
        values: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
        setMetadata: {
          "foo": "bar"
        },
        namespace
      }
      await index.update({ updateRequest })

      const updatedVectorResult = await index.fetch({
        ids: [updateRequest.id],
        namespace
      })
      const updatedVectors = updatedVectorResult?.vectors as object
      const updatedVector = updatedVectors[updateRequest.id]
      expect(updatedVector.values).toEqual(updateRequest.values)
    })

    it('should be able to fetch vectors by ID', async () => {
      const index = client.Index(indexName)
      const randomVectorId = getRandomVector(vectors).id
      const fetchResult = await index.fetch({
        ids: [randomVectorId],
        namespace
      })
      expect(Object.keys(fetchResult.vectors as object)).toContain(randomVectorId)
    })

    it('should be able to delete a vector', async () => {
      const randomVectorId = getRandomVector(vectors).id
      const index = client.Index(indexName)
      await index.delete1({
        ids: [randomVectorId],
        deleteAll: false,
        namespace
      })
      const fetchResult = await index.fetch({
        ids: [randomVectorId],
        namespace
      })
      expect(Object.keys(fetchResult.vectors as object).length).toBe(0)
    })

    it('should be able to delete all vector in namespace', async () => {
      const index = client.Index(indexName)
      await index.delete1({
        deleteAll: true,
        namespace
      })
      const fetchResult = await index.fetch({
        ids: [...vectors.map((v) => v.id)],
        namespace
      })
      expect(Object.keys(fetchResult.vectors as object).length).toBe(0)
    })
  })

  describe('Pinecone Client Control Plane operations', () => {
    const collectionName = `${indexName}-collection`

    it('created index should be listed', async () => {
      const list = await client.listIndexes()
      expect(list).toContain(indexName)
    })

    it('should be able to describe an index', async () => {
      const indexDescription: IndexMeta = await client.describeIndex({
        indexName
      })
      expect(indexDescription.database?.name).toEqual(indexName)
      expect(indexDescription.database?.metric).toEqual(metric)
    })

    it('should be able to create a collection', async () => {
      const createCollectionRequest: CreateCollectionRequest = {
        name: collectionName,
        source: indexName
      }
      await client.createCollection({
        createCollectionRequest
      })
      await waitUntilCollectionIsReady(client, collectionName)
      const list = await client.listCollections()
      expect(list).toContain(collectionName)
    })

    it('should be able to list collections', async () => {
      await waitUntilCollectionIsReady(client, collectionName)
      const list = await client.listCollections()
      expect(list).toContain(collectionName)
    })

    it('should be able to describe collection', async () => {
      await waitUntilCollectionIsReady(client, collectionName)
      const describeCollectionResult = await client.describeCollection({ collectionName })
      expect(describeCollectionResult?.name).toEqual(collectionName)
    })

    it('should be able to delete a collection', async () => {
      await waitUntilCollectionIsReady(client, collectionName)
      await client.deleteCollection({ collectionName })
      await waitUntilCollectionIsTerminated(client, collectionName)
      const list = await client.listCollections()
      expect(list).not.toContain(collectionName)
    })

    it('should be able to delete an index', async () => {
      await client.deleteIndex({ indexName })
      await waitUntilIndexIsTerminated(client, indexName)
      const list = await client.listIndexes()
      expect(list).not.toContain(indexName)
    })
  })
})