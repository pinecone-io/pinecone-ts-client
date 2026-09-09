import { Pinecone, Errors, ChatStream } from '@pinecone-database/pinecone';
import suite from './suite.cjs';

suite.consumerTests({ Pinecone, Errors, ChatStream }, 'ESM');
