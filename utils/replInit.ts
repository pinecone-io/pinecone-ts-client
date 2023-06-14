// The point of this file is to read environment variables from a .env file
// and import top level exports of the built version of the library so it can be easily used for
// manual testing. It will typically be invoked via `npm run repl`.

var dotenv = require('dotenv');
dotenv.config();

const expectedVars = ['PINECONE_ENVIRONMENT', 'PINECONE_API_KEY'];
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

// Even though this export is called PineconeClient, add an alias to
// LegacyPineconeClient so I don't get confused in manual testing. Allows me
// to initialize with "new LegacyPineconeClient()" instead of "new PineconeClient()"
// when working in the REPL.
myrepl.context['LegacyPineconeClient'] = pinecone.PineconeClient;

console.log(
  'SUCCESS Pinecone module exports (Pinecone, PineconeClient, etc) automatically imported to this repl session.'
);
console.log('')
console.log('Run init() to initialize a client and assign it to the "client" variable.')

const init = async () => {
  const client = await pinecone.Pinecone.createClient();
  myrepl.context['client'] = client;
  console.log('SUCCESS Created "client":')
  console.log(client)
  console.log('')

  const legacyClient = new pinecone.PineconeClient(); 
  await legacyClient.init({ apiKey: process.env.PINECONE_API_KEY, environment: process.env.PINECONE_ENVIRONMENT })
  myrepl.context['legacy'] = legacyClient;
  console.log('SUCCESS Created "legacy":')
  console.log(legacyClient)
}

myrepl.context['init'] = init;