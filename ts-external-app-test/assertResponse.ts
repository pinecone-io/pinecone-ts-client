/* Send requests to an external application and assert the response matches expectations. */

class EdgeExternalAppTest {
  url: string;
  constructor(public readonly apiKey: string, url: string) {
    this.apiKey = apiKey;
    this.url = url;
  }

  hitEndpoint = async (url: string) => {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        pinecone_api_key: this.apiKey,
      },
    });
    if (!response || response.status !== 200) {
      throw new Error(
        `Failed to hit endpoint.
         code: ${response.status},
         text: ${response.statusText},
         type: ${response.type},
         url: ${response.url}`
      );
    }
    return response;
  };

  assertOnResponse = async () => {
    const queryResponse = await this.hitEndpoint(this.url);

    if (queryResponse.ok) {
      const json = await queryResponse.json();
      return json['indexName'];
    }
  };
}

async function main() {
  try {
    const apiKey = process.env['PINECONE_API_KEY'];
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY environment variable is required.');
    }

    const url = process.argv[2];
    if (!url) {
      throw new Error('A valid URL argument is required.');
    }

    console.log('Testing against URL:', url);

    const tester = new EdgeExternalAppTest(apiKey, url);
    const indexName = await tester.assertOnResponse();

    console.log('Test passed. Index name:', indexName);
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
}

// Run the script
main();
