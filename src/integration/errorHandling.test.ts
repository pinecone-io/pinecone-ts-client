import { PineconeConnectionError } from '../errors';
import { Pinecone } from '../index';

describe('Error handling', () => {
  describe('when network error occurs', () => {
    let p;
    beforeEach(() => {
      p = new Pinecone({
        apiKey: process.env.PINECONE_API_KEY || '',
        fetchApi: async () => {
          throw new Error('network failure');
        },
      });
    });

    test('calling control plane', async () => {
      try {
        await p.listIndexes();
      } catch (e) {
        const err = e as PineconeConnectionError;
        expect(err.name).toEqual('PineconeConnectionError');
        expect(err.message).toEqual(
          'Request failed to reach Pinecone. This can occur for reasons such as incorrect configuration (environment, project id, index name), network problems that prevent the request from being completed, or a Pinecone API outage. Check your client configuration, check your network connection, and visit https://status.pinecone.io/ to see whether any outages are ongoing.'
        );
        // @ts-ignore
        expect(err.cause.name).toEqual('Error');
        // @ts-ignore
        expect(err.cause.message).toEqual('network failure');
      }
    });

    test('calling data plane', async () => {
      try {
        await p.index('foo-index').query({ topK: 10, id: '1' });
      } catch (e) {
        const err = e as PineconeConnectionError;
        expect(err.name).toEqual('PineconeConnectionError');
        expect(err.message).toEqual(
          `Request failed to reach Pinecone while calling https://controller.${process.env.PINECONE_ENVIRONMENT}.pinecone.io/actions/whoami. This can occur for reasons such as incorrect configuration (environment, project id, index name), network problems that prevent the request from being completed, or a Pinecone API outage. Check your client configuration, check your network connection, and visit https://status.pinecone.io/ to see whether any outages are ongoing.`
        );
      }
    });
  });
});
