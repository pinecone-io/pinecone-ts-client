import type {
  IndexStatsDescription,
  PineconeRecord,
  RecordMetadata,
  RecordSparseValues,
} from '../data';
import { Index, Pinecone } from '../index';

const metadataMap = {
  genre: ['action', 'comedy', 'drama', 'horror', 'romance', 'thriller'],
  year: [2010, 2011, 2012, 2013, 2014, 2015],
};
const metadataKeys = Object.keys(metadataMap);

export const prefix = 'preTest';
export const diffPrefix = 'diff-prefix';
export const globalNamespaceOne = 'global-ns-one';

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

export const generateRecords = ({
  dimension = 5,
  quantity = 3,
  prefix = null,
  withSparseValues = false,
  withMetadata = false,
}: {
  dimension?: number;
  quantity?: number;
  prefix?: string | null;
  withSparseValues?: boolean;
  withMetadata?: boolean;
}): PineconeRecord[] => {
  const records: PineconeRecord[] = [];
  for (let i = 0; i < quantity; i++) {
    const values: number[] = [];
    for (let j = 0; j < dimension; j++) {
      values.push(parseFloat(Math.random().toFixed(5)));
    }
    const id = prefix === null ? i.toString() : `${prefix}-${i}`;

    let vector: PineconeRecord = {
      id,
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
  return { indices, values };
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
  let isReady = false;

  while (!isReady) {
    try {
      const description = await p.describeIndex(indexName);
      if (
        description.status?.ready === true &&
        description.status?.state === 'Ready'
      ) {
        isReady = true;
      } else if (description.status?.state.toString().toLowerCase() === 'upgrading') {
        console.log('Index is upgrading, waiting...');
        await sleep(sleepIntervalMs);
      } else {
        await sleep(sleepIntervalMs);
      }
    } catch (error) {
      throw new Error(`Error while waiting for index to be ready: ${error}`);
    }
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

  // Sleeping one final time before returning for a bit more breathing room for freshness
  await sleep(sleepIntervalMs);

  return indexStats;
};

type Assertions = (result: any) => void;

export const assertWithRetries = async (
  asyncFn: () => Promise<any>,
  assertionsFn: Assertions,
  maxRetries: number = 5,
  delay: number = 3000
) => {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const result = await asyncFn();
      assertionsFn(result);
      return;
    } catch (error) {
      attempts++;
      if (attempts <= maxRetries) {
        await sleep(delay);
        // Double the delay for exponential backoff
        delay *= 2;
      } else {
        throw error;
      }
    }
  }
};

export const getRecordIds = async (index) => {
  const pag = await index.listPaginated();
  const ids: Array<string> = [];

  if (pag.vectors) {
    for (const vector of pag.vectors) {
      if (vector.id) {
        ids.push(vector.id);
      } else {
        console.log('No record ID found for vector:', vector);
      }
    }
  }
  if (ids.length > 0) {
    return ids;
  } else {
    console.log('No record IDs found in the serverless index');
  }
};
