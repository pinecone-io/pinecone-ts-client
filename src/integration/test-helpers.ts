import type { PineconeRecord, RecordSparseValues } from '../index';
import { Pinecone } from '../index';

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
  const indices: number[] = [];
  for (let j = 0; j < dimension; j++) {
    values.push(Math.random());
    indices.push(j);
  }
  const sparseValues: RecordSparseValues = { indices, values };
  return sparseValues;
};

export const randomIndexName = (testName: string): string => {
  return `it-${process.env.TEST_ENV}-${testName}-${randomString(8)}`
    .toLowerCase()
    .slice(0, 45);
};

export const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const waitUntilReady = async (indexName: string) => {
  const p = new Pinecone();
  const sleepIntervalMs = 1000;

  let description = await p.describeIndex(indexName);
  while (description.status?.state !== 'Ready') {
    await sleep(sleepIntervalMs);
    description = await p.describeIndex(indexName);
  }
};
