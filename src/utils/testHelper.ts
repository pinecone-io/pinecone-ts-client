import { ResponseError } from '../pinecone-generated-ts-fetch';

export const responseError = (status: number, message: string) => {
  return new ResponseError(
    {
      status,
      text: async () => message,
    } as Response,
    'oops'
  );
};
