import https from 'https';

const BASE_URL = 'https://ts-client-test-external-app.vercel.app/api';
const INDEX_NAME = 'test-external-index';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: any;
  headers?: { [key: string]: string };
}

async function request(path: string, options: RequestOptions): Promise<any> {
  const { method = 'GET', body, headers = {} } = options;
  const url = new URL(`${BASE_URL}${path}`);
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        method,
        path: url.pathname + url.search,
        port: 443,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (error) {
            reject(
              new Error(
                `Failed to parse JSON response from ${url}: ${error.message}`
              )
            );
          }
        });
      }
    );

    req.on('error', (error) =>
      reject(new Error(`Request to ${url} failed: ${error.message}`))
    );

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function createIndex(apiKey: string) {
  const response = await request('/createIndex', {
    method: 'GET',
    headers: {
      pinecone_api_key: apiKey,
      pinecone_index_name: INDEX_NAME,
    },
  });
  if (!response || response.status !== 200) {
    throw new Error(
      `Failed to createIndex:
        code: ${response.status},
        text: ${response.statusText},
        type: ${response.type},
        url: ${response.url}`
    );
  }
}

async function describeIndexDetails(apiKey: string) {
  const response = await request('/describeIndexDetails', {
    method: 'GET',
    headers: {
      pinecone_api_key: apiKey,
      pinecone_index_name: INDEX_NAME,
    },
  });
  if (!response || response.status !== 200) {
    throw new Error(
      `Failed to describeIndexDetails:
        code: ${response.status},
        text: ${response.statusText},
        type: ${response.type},
        url: ${response.url}`
    );
  }
}

async function deleteIndex(apiKey: string) {
  const response = await request('/deleteIndex', {
    method: 'GET',
    headers: {
      pinecone_api_key: apiKey,
      pinecone_index_name: INDEX_NAME,
    },
  });
  if (!response || response.status !== 200) {
    throw new Error(
      `Failed to deleteIndex:
        code: ${response.status},
        text: ${response.statusText},
        type: ${response.type},
        url: ${response.url}`
    );
  }
}

async function run() {
  try {
    const apiKey = process.env['PINECONE_API_KEY'];
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY environment variable is required.');
    }

    console.log(`Creating test index: ${INDEX_NAME}`);
    await createIndex(apiKey);

    console.log('Describing test index');
    const description = await describeIndexDetails(apiKey);
    console.log('Index description:', description);
    console.log(`Test passed using index: ${INDEX_NAME}`);
    deleteIndex(apiKey);
    process.exit(0);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

run();
