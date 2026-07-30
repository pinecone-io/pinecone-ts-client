// The point of this file is to read environment variables from a .env file
// and import top level exports of the built version of the library so it can be easily used for
// manual testing. It will typically be invoked via `npm run repl`.

const dotenv = require('dotenv');
dotenv.config();

// PINECONE_API_KEY powers the Pinecone (data/control plane) client via `init()`.
// PINECONE_CLIENT_ID / PINECONE_CLIENT_SECRET power the AdminClient via `initAdmin()`.
// Each group is optional so you can demo either surface without configuring the other.
const envGroups = [
  { vars: ['PINECONE_API_KEY'], initFn: 'init()' },
  {
    vars: ['PINECONE_CLIENT_ID', 'PINECONE_CLIENT_SECRET'],
    initFn: 'initAdmin()',
  },
];
for (const { vars, initFn } of envGroups) {
  const missing = vars.filter((envVar) => !process.env[envVar]);
  if (missing.length === 0) {
    console.log(
      `INFO Found ${vars.join(', ')} in .env file, so "await ${initFn}" is ready to use.`,
    );
  } else {
    console.warn(
      `WARNING Missing ${missing.join(', ')} in .env file. Set ${
        missing.length > 1 ? 'these' : 'this'
      } to use "await ${initFn}".`,
    );
  }
}

const myrepl = require('repl').start();
const pinecone = require('../dist');

// Automatically import all top-level exports from the built version of the library.
for (const [key, value] of Object.entries(pinecone)) {
  myrepl.context[key] = value;
}

console.log(
  'SUCCESS Pinecone module exports (Pinecone, etc) automatically imported to this repl session.',
);
console.log('');
console.log(
  'Run "await init()" to setup a Pinecone client instance using environment variable configs.',
);
console.log(
  'Run "await initAdmin()" to setup an AdminClient instance using environment variable configs.',
);

const init = async () => {
  const client = new pinecone.Pinecone();
  myrepl.context['client'] = client;
  console.log('SUCCESS Created new Pinecone client "client":');
  console.log(client);
};

const initAdmin = async () => {
  // Reads PINECONE_CLIENT_ID / PINECONE_CLIENT_SECRET from the environment (loaded from .env above).
  const admin = new pinecone.AdminClient();
  myrepl.context['admin'] = admin;
  console.log('SUCCESS Created new AdminClient "admin":');
  console.log(admin);
};

myrepl.context['init'] = init;
myrepl.context['initAdmin'] = initAdmin;
