const { teardown } = require('./teardown.ts');

module.exports = async function () {
  const apiKey = process.env.PINECONE_API_KEY;
  await teardown(apiKey);
  return null;
};
