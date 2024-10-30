// mockPineconeServer.js
const express = require('express');
const app = express();
let callCount = 0;

app.use(express.json());

app.post('/vectors/upsert', (req, res) => {
  callCount++;
  if (callCount === 1) {
    res.status(503).json({ name: 'PineconeUnavailableError' });
  } else {
    res.status(200).json({ status: 200, data: 'Success' });
  }
});

const server = app.listen(4000, () => console.log('Mock Pinecone server running on port 4000'));

module.exports = server;
