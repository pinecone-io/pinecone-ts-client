import { ResponseError } from '../pinecone-generated-ts-fetch';
import { handleApiError } from '../errors';

export const middleware = [
  {
    onError: async (context) => {
      const err = await handleApiError(context.error);
      throw err;
    },

    post: async (context) => {
      const { response } = context;

      if (response.status >= 200 && response.status < 300) {
        return response;
      } else {
        const err = await handleApiError(
          new ResponseError(response, 'Response returned an error')
        );
        throw err;
      }
    },
  },
];
