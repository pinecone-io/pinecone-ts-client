// ESM consumer: named imports from the CommonJS package under
// `module: nodenext` with `verbatimModuleSyntax`, type-only imports, and the
// `Errors` namespace export. Never executed; `tsc` type-checks it in every
// consumer TypeScript matrix leg.
import {
  Pinecone,
  Errors,
  type RecordMetadata,
} from '@pinecone-database/pinecone';
import type { QueryResponse } from '@pinecone-database/pinecone';

const pc = new Pinecone({ apiKey: 'compile-only', fetchApi: fetch });
const index = pc.index<RecordMetadata>('compilation-test');

export async function query(): Promise<QueryResponse<RecordMetadata>> {
  return index.query({ topK: 1, vector: [0.1] });
}

export const badRequest = Errors.PineconeBadRequestError;
