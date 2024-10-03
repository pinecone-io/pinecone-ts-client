const { setup } = require('./setup.ts');

module.exports = async function () {
  const apiKey = process.env.PINECONE_API_KEY;
  await setup(apiKey);
  return null;
};
