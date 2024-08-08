import {createCollection} from '../createCollection';
import {PineconeArgumentError} from '../../errors';
import type {
    CollectionModel,
    CreateCollectionOperationRequest,
    IndexList,
} from '../../pinecone-generated-ts-fetch/control';
import {ManageIndexesApi} from '../../pinecone-generated-ts-fetch/control';

const setOpenAPIResponse = (fakeCreateCollectionResponse) => {
    const fakeCreateCollection: (
        req: CreateCollectionOperationRequest
    ) => Promise<CollectionModel> = jest
        .fn()
        .mockImplementation(fakeCreateCollectionResponse);
    const fakeListIndexes: () => Promise<IndexList> = jest
        .fn()
        .mockImplementation(() =>
            Promise.resolve({
                indexes: [
                    {
                        name: 'index-1',
                        dimension: 1,
                        metric: 'cosine',
                        host: '123-345-abcd.io',
                        spec: {
                            pod: {
                                environment: 'us-west1',
                                replicas: 1,
                                shards: 1,
                                podType: 'p1.x1',
                                pods: 1,
                            },
                        },
                        status: {ready: true, state: 'Ready'},
                    },
                    {
                        name: 'index-2',
                        dimension: 3,
                        metric: 'cosine',
                        host: '321-543-bcda.io',
                        spec: {
                            pod: {
                                environment: 'us-west1',
                                replicas: 1,
                                shards: 1,
                                podType: 'p1.x1',
                                pods: 1,
                            },
                        },
                        status: {ready: true, state: 'Ready'},
                    },
                ],
            })
        );
    const IOA = {
        createCollection: fakeCreateCollection,
        listIndexes: fakeListIndexes,
    } as ManageIndexesApi;

    return IOA;
};

describe('createCollection', () => {
    describe('argument validations', () => {
        test('throws if no arguments are provided', async () => {
            const IOA = setOpenAPIResponse(() => Promise.resolve(''));
            const toThrow = async () => {
                // @ts-ignore
                await createCollection(IOA)();
            };
            await expect(toThrow).rejects.toThrow(PineconeArgumentError);
            await expect(toThrow).rejects.toThrow(
                'The argument passed to createCollection must be a non-empty object.');
        });


        test('throws if argument is not an object', async () => {
            const IOA = setOpenAPIResponse(() => Promise.resolve(''));
            const toThrow = async () => {
                // @ts-ignore
                await createCollection(IOA)('not an object');
            };

            await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
            await expect(toThrow).rejects.toThrowError(
                'The argument passed to createCollection must be a non-empty object.'
            );
        });

        test('throws if empty object', async () => {
            const IOA = setOpenAPIResponse(() => Promise.resolve(''));
            const toThrow = async () => {
                // @ts-ignore
                await createCollection(IOA)({});
            };

            await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
            await expect(toThrow).rejects.toThrowError(
                'The argument passed to createCollection must be a non-empty object.'
            );
        });

        test('throws if name is not provided', async () => {
            const IOA = setOpenAPIResponse(() => Promise.resolve(''));
            const toThrow = async () => {
                await createCollection(IOA)({
                    name: '',
                    source: 'source-index-name',
                });
            };

            await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
            await expect(toThrow).rejects.toThrowError(
                "You must enter a non-empty string for the \`name\` field."
            );
        });

        test('throws if name is not a string', async () => {
            const IOA = setOpenAPIResponse(() => Promise.resolve(''));
            const toThrow = async () => {
                // @ts-ignore
                await createCollection(IOA)({name: 1, source: 'source-index-name'});
            };

            await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
            await expect(toThrow).rejects.toThrowError(
                "You must enter a non-empty string for the \`name\` field."
            );
        });

        test('throws if name is blank', async () => {
            const IOA = setOpenAPIResponse(() => Promise.resolve(''));
            const toThrow = async () => {
                await createCollection(IOA)({
                    name: '',
                    source: 'source-index-name',
                });
            };
            await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
            await expect(toThrow).rejects.toThrowError(
                "You must enter a non-empty string for the \`name\` field."
            );
        });


        test('throws if source is not provided', async () => {
            const IOA = setOpenAPIResponse(() => Promise.resolve(''));
            const toThrow = async () => {
                // @ts-ignore
                await createCollection(IOA)({name: 'collection-name'});
            };

            await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
            await expect(toThrow).rejects.toThrowError(
                'You must enter a non-empty string for the \`source\` field.'
            );
        });

        test('throws if source is not a string', async () => {
            const IOA = setOpenAPIResponse(() => Promise.resolve(''));
            const toThrow = async () => {
                // @ts-ignore
                await createCollection(IOA)({name: 'collection-name', source: 1});
            };
            await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
            await expect(toThrow).rejects.toThrowError(
                "You must enter a non-empty string for the \`source\` field."
            );
        });

        test('throws if source is blank', async () => {
            const IOA = setOpenAPIResponse(() => Promise.resolve(''));
            const toThrow = async () => {
                await createCollection(IOA)({
                    name: 'collection-name',
                    source: '',
                });
            };
            await expect(toThrow).rejects.toThrowError(PineconeArgumentError);
            await expect(toThrow).rejects.toThrowError(
                "You must enter a non-empty string for the \`source\` field."
            );
        });
    });

    test('calls the openapi create collection endpoint', async () => {
        const collectionModel = {
            name: 'collection-name',
            size: 12346,
            status: 'Initializing',
            dimension: 5,
            recordCount: 50,
            environment: 'us-east1-gcp',
        };
        const IOA = setOpenAPIResponse(() => Promise.resolve(collectionModel));
        const returned = await createCollection(IOA)({
            name: 'collection-name',
            source: 'source-index-name',
        });

        expect(returned).toEqual(collectionModel);
        expect(IOA.createCollection).toHaveBeenCalledWith({
            createCollectionRequest: {
                name: 'collection-name',
                source: 'source-index-name',
            },
        });
    });
});
