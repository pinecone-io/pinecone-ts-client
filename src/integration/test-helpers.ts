import type {
  DocumentRecord,
  IndexStatsDescription,
  PineconeRecord,
  RecordMetadata,
  RecordSparseValues,
  RecordValues,
} from '../data';
import { Index, Pinecone } from '../index';
import { PineconeNotFoundError } from '../errors';

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

// These deadlines bound integration polling without changing SDK defaults.
export const waitForReady = async (
  describe: () => Promise<{ ready: boolean; state?: string }>,
  resource: string,
  maxWaitMs = 180_000,
) => {
  const deadline = Date.now() + maxWaitMs;
  let state: string | undefined;
  while (true) {
    const result = await describe();
    state = result.state;
    if (result.ready) return;
    if (
      ['InitializationFailed', 'Failed', 'Terminating', 'Disabled'].includes(
        state ?? '',
      )
    ) {
      throw new Error(`${resource} entered terminal state '${state}'`);
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      throw new Error(
        `Timed out after ${maxWaitMs}ms waiting for ${resource}; last state: ${state ?? 'unknown'}`,
      );
    }
    await sleep(Math.min(1000, remaining));
  }
};

export const waitUntilIndexReady = async (
  indexName: string,
  maxWaitMs = 180_000,
) => {
  const p = new Pinecone();
  await waitForReady(
    async () => {
      const description = await p.indexes.describe(indexName);
      return {
        ready:
          description.status?.ready === true &&
          description.status?.state === 'Ready',
        state: description.status?.state,
      };
    },
    `index '${indexName}'`,
    maxWaitMs,
  );
};

export const waitUntilAssistantReady = async (
  assistantName: string,
  maxWaitMs = 180_000,
) => {
  const p = new Pinecone();
  await waitForReady(
    async () => {
      const description = await p.assistants.describe(assistantName);
      return {
        ready: description.status === 'Ready',
        state: description.status,
      };
    },
    `assistant '${assistantName}'`,
    maxWaitMs,
  );
};

export const waitUntilAssistantFileReady = async (
  assistantName: string,
  fileId: string,
  maxWaitMs = 180_000,
) => {
  const p = new Pinecone();
  await waitForReady(
    async () => {
      const description = await p
        .assistant({ name: assistantName })
        .describeFile(fileId, true);
      return {
        ready: description.status === 'Available',
        state: description.status,
      };
    },
    `assistant file '${fileId}'`,
    maxWaitMs,
  );
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
    indexStats.namespaces?.[namespace]?.recordCount !== recordIds.length;

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
  if (totalMsWait <= 0 || delay <= 0)
    throw new Error('Retry timeout and delay must be positive');
  let lastError: any = null;
  const deadline = Date.now() + totalMsWait;

  while (Date.now() < deadline) {
    try {
      const result = await asyncFn();
      assertionsFn(result);
      return;
    } catch (error) {
      lastError = error;
      await sleep(Math.min(delay, Math.max(0, deadline - Date.now())));
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

export const retryDelete = async (
  remove: () => Promise<unknown>,
  resource: string,
  maxWaitMs = 30_000,
) => {
  const deadline = Date.now() + maxWaitMs;
  while (true) {
    try {
      await remove();
      return;
    } catch (error) {
      if (error instanceof PineconeNotFoundError) return;
      // Configuration/permission failures will not improve by retrying.
      const retryable =
        error instanceof Error &&
        [
          'PineconeConflictError',
          'PineconeInternalServerError',
          'PineconeUnavailableError',
          'PineconeMaxRetriesExceededError',
          'PineconeConnectionError',
        ].includes(error.name);
      const remaining = deadline - Date.now();
      if (!retryable || remaining <= 0) {
        throw new Error(`Failed to delete ${resource}`, { cause: error });
      }
      await sleep(Math.min(1000, remaining));
    }
  }
};

export const retryDeletes = async (
  pc: Pinecone,
  indexName: string,
  maxWaitMs = 30_000,
) =>
  retryDelete(
    () => pc.indexes.delete(indexName),
    `index '${indexName}'`,
    maxWaitMs,
  );

// All registered resources are attempted, even when an earlier deletion fails.
export const cleanupResources = async (
  pc: Pinecone,
  indexes: string[] = [],
  assistants: string[] = [],
) => {
  const results = await Promise.allSettled([
    ...indexes.map((name) => retryDeletes(pc, name)),
    ...assistants.map((name) =>
      retryDelete(() => pc.assistants.delete(name), `assistant '${name}'`),
    ),
  ]);
  const failures = results.flatMap((result) =>
    result.status === 'rejected' ? [result.reason] : [],
  );
  if (failures.length)
    throw new AggregateError(failures, 'Integration resource cleanup failed');
};
