let BASE_URL = 'https://ts-client-test-external-app.vercel.app/api';
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

  try {
    const response = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(
        `Request to ${url} failed with status ${response.status}: ${response.statusText}`
      );
    }

    const text = await response.text();

    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(
        `Failed to parse JSON response from ${url}: ${error.message}`
      );
    }
  } catch (error) {
    throw new Error(`Request to ${url} failed: ${error.message}`);
  }
}

async function createIndex(apiKey: string) {
  const response = await request('/createIndex', {
    method: 'GET',
    headers: {
      pinecone_api_key: apiKey,
      pinecone_index_name: INDEX_NAME,
    },
  });
  console.log('Response from createIndex:', response);
}

async function describeIndexDetails(apiKey: string) {
  const response = await request('/describeIndexDetails', {
    method: 'GET',
    headers: {
      pinecone_api_key: apiKey,
      pinecone_index_name: INDEX_NAME,
    },
  });
  console.log('Response from describeIndexDetails:', response);
}

async function deleteIndex(apiKey: string) {
  const response = await request('/deleteIndex', {
    method: 'GET',
    headers: {
      pinecone_api_key: apiKey,
      pinecone_index_name: INDEX_NAME,
    },
  });
  console.log('Response from deleteIndex:', response);
}

async function run() {
  try {
    const apiKey = process.env['PINECONE_API_KEY'];
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY environment variable is required.');
    }

    const args = process.argv.slice(2);
    if (args.length > 0) {
      const hostOverride = args.find((arg) => arg.startsWith('--base-url='));
      if (hostOverride) {
        BASE_URL = hostOverride.split('=')[1];
      }
    }

    console.log(`Creating test index: ${INDEX_NAME}`);
    await createIndex(apiKey);

    // wait a bit for index creation before hitting describeIndexDetails
    await new Promise((resolve) => setTimeout(resolve, 10000));

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
