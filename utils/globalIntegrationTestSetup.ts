import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['PINECONE_API_KEY'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

afterAll(() => {
  const handles = (process as any)._getActiveHandles?.() || [];
  const requests = (process as any)._getActiveRequests?.() || [];

  console.log(`\n🧵 Active Handles: ${handles.length}`);
  handles.forEach((handle: any, i: number) => {
    console.log(
      `[${i}] Handle type: ${handle.constructor?.name || typeof handle}`
    );

    // Optional deep dive for socket handles
    if (
      handle.constructor?.name === 'Socket' ||
      handle.constructor?.name === 'TLSSocket'
    ) {
      console.log(
        `  → Socket local: ${handle.localAddress}:${handle.localPort}`
      );
      console.log(
        `  → Socket remote: ${handle.remoteAddress}:${handle.remotePort}`
      );
    }

    // Timers
    if (handle.constructor?.name === 'Timeout') {
      console.log(`  → Timeout _idleTimeout: ${handle._idleTimeout}`);
    }

    // File descriptors (e.g., fs.ReadStream)
    if (typeof handle.fd === 'number') {
      console.log(`  → File descriptor: ${handle.fd}`);
    }
  });

  console.log(`\n📡 Active Requests: ${requests.length}`);
  requests.forEach((request: any, i: number) => {
    console.log(
      `[${i}] Request type: ${request.constructor?.name || typeof request}`
    );
  });

  console.log('\n🧼 Add cleanup logic or destroy agents if necessary.\n');

  handles
    .filter((h: any) => h.constructor?.name === 'Timeout')
    .forEach((h, i) => {
      console.log(`[${i}] Pending Timeout:`);
      console.dir(h, { depth: 2 });
    });
});
