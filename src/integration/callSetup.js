const { setup } = require('./setup.ts');

module.exports = async function () {
  await setup();
  return null;
};
