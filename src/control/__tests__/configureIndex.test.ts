import {configureIndex} from '../configureIndex';
import type {ConfigureIndexOperationRequest, IndexModel,} from '../../pinecone-generated-ts-fetch/control';
import {ManageIndexesApi} from '../../pinecone-generated-ts-fetch/control';
import {PineconeArgumentError} from "../../errors";

describe('configureIndex', () => {
    test('calls the openapi configure endpoint', async () => {
        const indexModel = {
            name: 'index-name',
            dimension: 5,
            metric: 'cosine',
            host: 'https://index-host.com',
            spec: {
                pod: {
                    environment: 'us-east1-gcp',
                    replicas: 4,
                    shards: 1,
                    pods: 4,
                    podType: 'p2.x2',
                },
            },
            status: {
                ready: true,
                state: 'Ready',
            },
        };
        const fakeConfigure: (
            req: ConfigureIndexOperationRequest
        ) => Promise<IndexModel> = jest.fn().mockResolvedValue(indexModel);
        const IOA = {configureIndex: fakeConfigure} as ManageIndexesApi;

        const returned = await configureIndex(IOA)('index-name', {
            spec: {pod: {replicas: 4, podType: 'p2.x2'}},
        });

        expect(returned).toBe(indexModel);
        expect(IOA.configureIndex).toHaveBeenCalledWith({
            indexName: 'index-name',
            configureIndexRequest: {
                spec: {pod: {replicas: 4, podType: 'p2.x2'}},
            },
        });
    });


    test('call configure endpoint without spec or name', async () => {
        const indexModel = {
            name: 'index-name',
            dimension: 5,
            metric: 'cosine',
        };
        const fakeConfigure: (
            req: ConfigureIndexOperationRequest
        ) => Promise<IndexModel> = jest.fn().mockResolvedValue(indexModel);
        const IOA = {configureIndex: fakeConfigure} as ManageIndexesApi;

        await expect(async () => {
            await configureIndex(IOA)('', {});
        }).rejects.toThrow(PineconeArgumentError);
    });

});