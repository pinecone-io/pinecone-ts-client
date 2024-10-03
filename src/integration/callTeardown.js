const { teardown } = require('./teardown.ts');
const dotenv = require('dotenv');

module.exports = async function () {
  dotenv.config();
  const requiredEnvVars = ['PINECONE_API_KEY'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
  await teardown();
  return null;
};
