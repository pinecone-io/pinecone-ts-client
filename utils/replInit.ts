// The point of this file is to read environment variables from a .env file
// and import top level exports of the built version of the library so it can be easily used for
// manual testing. It will typically be invoked via `npm run repl`.

var dotenv = require('dotenv');
dotenv.config();

const expectedVars = ['PINECONE_API_KEY'];
for (const envVar of expectedVars) {
  if (!process.env[envVar]) {
    console.warn(`WARNING Missing environment variable ${envVar} in .env file`);
  } else {
    console.log(`INFO Found environment variable ${envVar} in .env file`);
  }
}

var myrepl = require('repl').start();
var pinecone = require('../dist');

// Automatically import all top-level exports from the built version of the library.
for (const [key, value] of Object.entries(pinecone)) {
  myrepl.context[key] = value;
}

console.log(
  'SUCCESS Pinecone module exports (Pinecone, etc) automatically imported to this repl session.',
);
console.log('');
console.log(
  'Run "await init()" to setup client instance using environment variable configs.',
);

const init = async () => {
  const client = new pinecone.Pinecone();
  myrepl.context['client'] = client;
  console.log('SUCCESS Created new client "client":');
  console.log(client);
};

myrepl.context['init'] = init;
