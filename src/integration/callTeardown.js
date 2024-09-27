const { teardown } = require('./teardown.ts');

module.exports = async function () {
  await teardown();
  return null;
};
