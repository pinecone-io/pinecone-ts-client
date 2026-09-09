const { Pinecone, Errors, ChatStream } = require('@pinecone-database/pinecone');
const { consumerTests } = require('./suite.cjs');

consumerTests({ Pinecone, Errors, ChatStream }, 'CommonJS');
