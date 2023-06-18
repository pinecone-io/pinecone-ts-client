import { describeIndex } from "../describeIndex";
import { PineconeArgumentError, PineconeInternalServerError, PineconeNotFoundError } from "../../errors";

describe('describeIndex', () => {
    const responseData = Object.freeze({
        database: {
          name: 'test-index',
          dimensions: undefined,
          indexType: undefined,
          metric: 'cosine',
          pods: 1,
          replicas: 1,
          shards: 1,
          podType: 'p1.x1',
          indexConfig: undefined,
          metadataConfig: undefined
        },
        status: { ready: true, state: 'Ready' }
      });

    test('should remove undefined fields from response', async () => {
        const IndexOperationsApi = {
            describeIndex: jest.fn().mockImplementation(() => Promise.resolve(responseData))
        }
        jest.mock('../../pinecone-generated-ts-fetch', () => ({
            IndexOperationsApi: IndexOperationsApi
        }));

        // @ts-ignore
        const returned = await (describeIndex(IndexOperationsApi))('index-name');

        expect(returned).toEqual({
            database: {
              name: 'test-index',
              metric: 'cosine',
              pods: 1,
              replicas: 1,
              shards: 1,
              podType: 'p1.x1'
            },
            status: { ready: true, state: 'Ready' }
          });
    });

    describe('argument validation', () => {
        test('should throw if index name is not provided', async () => {
            const IndexOperationsApi = {
                describeIndex: jest.fn().mockImplementation(() => Promise.resolve(responseData))
            }
            jest.mock('../../pinecone-generated-ts-fetch', () => ({
                IndexOperationsApi: IndexOperationsApi
            }));
    
            // @ts-ignore
            const expectToThrow = async () => await (describeIndex(IndexOperationsApi))();
    
            expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
            expect(expectToThrow).rejects.toThrowError('Argument to describeIndex must be string');
        });

        test('should throw if index name is not a string', async () => {
            const IndexOperationsApi = {
                describeIndex: jest.fn().mockImplementation(() => Promise.resolve(responseData))
            }
            jest.mock('../../pinecone-generated-ts-fetch', () => ({
                IndexOperationsApi: IndexOperationsApi
            }));
    
            // @ts-ignore
            const expectToThrow = async () => await (describeIndex(IndexOperationsApi))({});
    
            expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
            expect(expectToThrow).rejects.toThrowError('Argument to describeIndex must be string');
        });

        test('should throw if index name is empty string', async () => {
            const IndexOperationsApi = {
                describeIndex: jest.fn().mockImplementation(() => Promise.resolve(responseData))
            }
            jest.mock('../../pinecone-generated-ts-fetch', () => ({
                IndexOperationsApi: IndexOperationsApi
            }));
    
            // @ts-ignore
            const expectToThrow = async () => await (describeIndex(IndexOperationsApi))('');
    
            expect(expectToThrow).rejects.toThrowError(PineconeArgumentError);
            expect(expectToThrow).rejects.toThrowError('Argument to describeIndex must not be blank');
        })
    })

    describe('uses http error mapper', () => {
        test('it should map errors with the http error mapper (500)', async () => {
            const IndexOperationsApi = {
                describeIndex: jest.fn().mockImplementation(() => Promise.reject({response: {status: 500}}))
            }
            jest.mock('../../pinecone-generated-ts-fetch', () => ({
                IndexOperationsApi: IndexOperationsApi
            }));
            
            // @ts-ignore
            const expectToThrow = async () => await (describeIndex(IndexOperationsApi))('index-name');
            
            expect(expectToThrow).rejects.toThrowError(PineconeInternalServerError);
        });
    });

    describe('custom error mapping', () => {
        test('not found (404), fetches and shows available index names', async () => {
            const IndexOperationsApi = {
                describeIndex: jest.fn().mockImplementation(() => Promise.reject({response: {status: 404}})),
                listIndexes: jest.fn().mockImplementation(() => Promise.resolve(['foo', 'bar']))
            }
            jest.mock('../../pinecone-generated-ts-fetch', () => ({
                IndexOperationsApi: IndexOperationsApi
            }));
            
            // @ts-ignore
            const expectToThrow = async () => await (describeIndex(IndexOperationsApi))('index-name');
            
            expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
            expect(expectToThrow).rejects.toThrowError(`Index 'index-name' does not exist. Valid index names: ['foo', 'bar']`);
        })

        test('not found (404), fetches and shows available index names (empty list)', async () => {
            const IndexOperationsApi = {
                describeIndex: jest.fn().mockImplementation(() => Promise.reject({response: {status: 404}})),
                listIndexes: jest.fn().mockImplementation(() => Promise.resolve([]))
            }
            jest.mock('../../pinecone-generated-ts-fetch', () => ({
                IndexOperationsApi: IndexOperationsApi
            }));
            
            // @ts-ignore
            const expectToThrow = async () => await (describeIndex(IndexOperationsApi))('index-name');
            
            expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
            expect(expectToThrow).rejects.toThrowError(`Index 'index-name' does not exist. Valid index names: []`);
        })

        test('not found (404), error while fetching index list', async () => {
            const IndexOperationsApi = {
                describeIndex: jest.fn().mockImplementation(() => Promise.reject({response: {status: 404}})),
                listIndexes: jest.fn().mockImplementation(() => Promise.reject('error'))
            }
            jest.mock('../../pinecone-generated-ts-fetch', () => ({
                IndexOperationsApi: IndexOperationsApi
            }));
            
            // @ts-ignore
            const expectToThrow = async () => await (describeIndex(IndexOperationsApi))('index-name');
            
            expect(expectToThrow).rejects.toThrowError(PineconeNotFoundError);
            expect(expectToThrow).rejects.toThrowError(`Index 'index-name' does not exist.`);
        })
    })
});