import { PineconeConnectionError } from '../errors';
import { Pinecone } from '../index';

describe('Error handling', () => {
  describe('when API key is wrong', () => {
    test('calling control plane', async () => {
      const p = new Pinecone({
        apiKey: '123-456-789',
      });

      expect.assertions(2);
      try {
        await p.listIndexes();
      } catch (e) {
        const err = e as PineconeConnectionError;
        expect(err.name).toEqual('PineconeUnmappedHttpError');
        expect(err.message).toEqual(
          'An unexpected error occured while calling the https://api.pinecone.io/databases endpoint.  Unknown or invalid API Key Status: 403.'
        );
        // TODO: Update when cause is populated
        // expect(err.cause).toBeDefined();
      }
    });

    test('calling data plane', async () => {
      const p = new Pinecone({
        apiKey: '123-456-789',
      });

      expect.assertions(2);
      try {
        await p.index('foo-index').query({ topK: 10, id: '1' });
      } catch (e) {
        const err = e as PineconeConnectionError;
        expect(err.name).toEqual('PineconeUnmappedHttpError');
        expect(err.message).toEqual(
          'An unexpected error occured while calling the https://api.pinecone.io/databases/foo-index endpoint.  Unknown or invalid API Key Status: 403.'
        );
      }
    });

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
        expect.assertions(4);
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
          expect(err.name).toEqual('PineconeUnmappedHttpError');
          expect(err.message).toEqual(
            `An unexpected error occured while calling the https://api.pinecone.io/databases/foo-index endpoint.  Unknown or invalid API Key Status: 403.`
          );
        }
      });
    });
  });
});
