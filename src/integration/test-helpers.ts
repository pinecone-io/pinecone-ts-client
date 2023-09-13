import { Pinecone } from '../index';
import type { PineconeRecord, RecordSparseValues } from '../index';

export const randomString = (length) => {
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
};

export const createIndexIfDoesNotExist = async (
  pinecone: Pinecone,
  indexName: string
) => {
  const indexList = await pinecone.listIndexes();
  let found = false;
  indexList.forEach((i) => {
    if (i.name === indexName) {
      found = true;
    }
  });
  if (!found) {
    await pinecone.createIndex({
      name: indexName,
      dimension: 5,
      waitUntilReady: true,
    });
  }
};

export const generateRecords = (
  dimension: number,
  quantity: number,
  withSparseValues?: boolean
): PineconeRecord[] => {
  const vectors: PineconeRecord[] = [];
  for (let i = 0; i < quantity; i++) {
    const values: number[] = [];
    for (let j = 0; j < dimension; j++) {
      values.push(Math.random());
    }
    let vector: PineconeRecord = {
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

export const generateSparseValues = (dimension: number): RecordSparseValues => {
  const values: number[] = [];
  const indecies: number[] = [];
  for (let j = 0; j < dimension; j++) {
    values.push(Math.random());
    indecies.push(j);
  }
  const sparseValues: RecordSparseValues = {
    indices: indecies,
    values: values,
  };
  return sparseValues;
};
