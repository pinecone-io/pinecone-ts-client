import type {
  DocumentRecord,
  IndexStatsDescription,
  PineconeRecord,
  RecordMetadata,
  RecordSparseValues,
  RecordValues,
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

export const randomName = (name: string): string => {
  return `${name}-${randomString(8)}`.toLowerCase().slice(0, 45);
};

export const generateRecords = ({
  dimension = 5,
  quantity = 3,
  prefix = null,
  withValues = true,
  withSparseValues = false,
  withMetadata = false,
}: {
  dimension?: number;
  quantity?: number;
  prefix?: string | null;
  withValues?: boolean;
  withSparseValues?: boolean;
  withMetadata?: boolean;
}): PineconeRecord[] => {
  const records: PineconeRecord[] = [];
  for (let i = 0; i < quantity; i++) {
    const id = prefix === null ? i.toString() : `${prefix}-${i}`;

    const values = withValues ? generateValues(dimension) : undefined;
    const sparseValues = withSparseValues
      ? generateSparseValues(dimension)
      : undefined;

    let vector: PineconeRecord = {
      id,
      values,
      sparseValues,
    };

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

/**
 * The name of the `dense_vector` field used by document-based test indexes.
 * Document operations address vectors by field name (`scoreBy.field`,
 * `includeFields`), so this is threaded through fixtures rather than hardcoded
 * at each call site.
 */
export const vectorFieldName = 'embedding';

/**
 * Document-shaped counterpart to {@link generateRecords}, for schema-based
 * indexes. Documents use `_id`, carry vector values under a named schema field,
 * and hold metadata as ordinary top-level fields (indexed automatically at
 * upsert) rather than nested under `metadata`.
 */
export const generateDocuments = ({
  dimension = 5,
  quantity = 3,
  prefix = null,
  withValues = true,
  withMetadata = false,
  fieldName = vectorFieldName,
}: {
  dimension?: number;
  quantity?: number;
  prefix?: string | null;
  withValues?: boolean;
  withMetadata?: boolean;
  fieldName?: string;
}): DocumentRecord[] => {
  const documents: DocumentRecord[] = [];
  for (let i = 0; i < quantity; i++) {
    const _id = prefix === null ? i.toString() : `${prefix}-${i}`;

    let doc: DocumentRecord = { _id };
    if (withValues) {
      doc = { ...doc, [fieldName]: generateValues(dimension) };
    }
    if (withMetadata) {
      doc = { ...doc, ...generateMetadata() };
    }
    documents.push(doc);
  }
  return documents;
};

export const generateValues = (dimension: number): RecordValues => {
  const values: number[] = [];
  for (let i = 0; i < dimension; i++) {
    values.push(parseFloat(Math.random().toFixed(5)));
  }

  return values;
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

export const sleep = async (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const waitUntilIndexReady = async (indexName: string) => {
  const p = new Pinecone();
  const sleepIntervalMs = 1000;
  let isReady = false;

  while (!isReady) {
    try {
      const description = await p.indexes.describe(indexName);
      if (
        description.status?.ready === true &&
        description.status?.state === 'Ready'
      ) {
        isReady = true;
      } else {
        await sleep(sleepIntervalMs);
      }
    } catch (error) {
      throw new Error(`Error while waiting for index to be ready: ${error}`, {
        cause: error,
      });
    }
  }
};

export const waitUntilAssistantReady = async (assistantName: string) => {
  const p = new Pinecone();
  const sleepIntervalMs = 1000;
  let isReady = false;

  while (!isReady) {
    try {
      const description = await p.assistants.describe(assistantName);
      if (description.status === 'Ready') {
        isReady = true;
      } else {
        await sleep(sleepIntervalMs);
      }
    } catch (error) {
      throw new Error(
        `Error while waiting for assistant to be ready: ${error}`,
        { cause: error },
      );
    }
  }
};

export const waitUntilAssistantFileReady = async (
  assistantName: string,
  fileId: string,
) => {
  const p = new Pinecone();
  const sleepIntervalMs = 1000;
  let isReady = false;

  while (!isReady) {
    try {
      const description = await p
        .assistant({ name: assistantName })
        .describeFile(fileId, true);
      if (description.status === 'Available') {
        isReady = true;
      } else {
        await sleep(sleepIntervalMs);
      }
    } catch (error) {
      throw new Error(
        `Error while waiting for assistant file to be ready: ${error}`,
        { cause: error },
      );
    }
  }
};

export const waitUntilRecordsReady = async (
  index: Index,
  namespace: string,
  recordIds: string[],
  maxWaitMs = 90_000,
): Promise<IndexStatsDescription> => {
  const sleepIntervalMs = 1000; // Reduced from 3000ms for faster polling
  const deadline = Date.now() + maxWaitMs;
  let indexStats = await index.describeIndexStats();

  const notReady = () =>
    (indexStats.namespaces && !indexStats.namespaces[namespace]) ||
    (indexStats.namespaces &&
      indexStats.namespaces[namespace]?.recordCount !== recordIds.length);

  // if namespace is empty or the record count is not equal to the number of records we expect
  while (notReady()) {
    // Bounded so that writes which never land surface as a clear failure here
    // rather than hanging until the CI job times out.
    if (Date.now() >= deadline) {
      const observed = indexStats.namespaces?.[namespace]?.recordCount;
      throw new Error(
        `Timed out after ${maxWaitMs}ms waiting for records to be ready in ` +
          `namespace '${namespace}': expected ${recordIds.length} record(s), ` +
          `observed ${observed ?? 'no namespace'}.`,
      );
    }
    await sleep(sleepIntervalMs);
    indexStats = await index.describeIndexStats();
  }

  // Records are ready, return immediately
  return indexStats;
};

type Assertions = (result: any) => void;

export const assertWithRetries = async (
  asyncFn: () => Promise<any>,
  assertionsFn: Assertions,
  totalMsWait: number = 180000,
  delay: number = 3000,
) => {
  let lastError: any = null;

  for (let msElapsed = 0; msElapsed < totalMsWait; msElapsed += delay) {
    try {
      const result = await asyncFn();
      assertionsFn(result);
      return;
    } catch (error) {
      lastError = error;
      await sleep(delay);
    }
  }

  throw lastError;
};

export const getRecordIds = async (index: Index) => {
  const page = await index.listDocuments({});
  const ids: Array<string> = [];

  for (const doc of page.documents) {
    if (doc._id) {
      ids.push(doc._id);
    } else {
      console.log('No document ID found for document:', doc);
    }
  }
  if (ids.length > 0) {
    return ids;
  } else {
    console.log('No document IDs found in the serverless index');
  }
};

export const retryDeletes = async (pc: Pinecone, indexName: string) => {
  try {
    await pc.indexes.delete(indexName);
  } catch (e) {
    console.log(
      `Encountered error when trying to delete index: ${e}`,
      '\n\nSleeping for 1s and retrying...\n\n',
    );
    await sleep(1000);
    await retryDeletes(pc, indexName);
  }
};
