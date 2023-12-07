import type {
  IndexStatsDescription,
  PineconeRecord,
  RecordSparseValues,
  RecordMetadata,
} from '../index';
import { Pinecone, Index } from '../index';

const metadataMap = {
  genre: ['action', 'comedy', 'drama', 'horror', 'romance', 'thriller'],
  year: [2010, 2011, 2012, 2013, 2014, 2015],
};
const metadataKeys = Object.keys(metadataMap);

export const INDEX_NAME = 'ts-integration';

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
  withSparseValues?: boolean,
  withMetadata?: boolean
): PineconeRecord[] => {
  const records: PineconeRecord[] = [];
  for (let i = 0; i < quantity; i++) {
    const values: number[] = [];
    for (let j = 0; j < dimension; j++) {
      values.push(parseFloat(Math.random().toFixed(5)));
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
    if (withMetadata) {
      vector = {
        ...vector,
        metadata: generateMetadata(),
      };
    }
    records.push(vector);
  }
  return records;
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

export const generateMetadata = (): RecordMetadata => {
  const metaKey = metadataKeys[Math.floor(Math.random() * metadataKeys.length)];
  const metaValue =
    metadataMap[metaKey][
      Math.floor(Math.random() * metadataMap[metaKey].length)
    ];
  return { [metaKey]: metaValue };
};

export const randomIndexName = (testName: string): string => {
  return `${process.env.TEST_ENV}-${testName}-${randomString(8)}`
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

export const waitUntilRecordsReady = async (
  index: Index,
  namespace: string,
  recordIds: string[]
): Promise<IndexStatsDescription> => {
  const sleepIntervalMs = 3000;
  let indexStats = await index.describeIndexStats();

  while (
    indexStats.namespaces &&
    !indexStats.namespaces[namespace] &&
    indexStats.namespaces[namespace]?.recordCount !== recordIds.length
  ) {
    await sleep(sleepIntervalMs);
    indexStats = await index.describeIndexStats();
  }

  return indexStats;
};
