import {
  CreateNamespaceOperationRequest,
  NamespaceDescription,
  NamespaceOperationsApi,
  X_PINECONE_API_VERSION,
} from '../../../pinecone-generated-ts-fetch/db_data';
import { NamespaceOperationsProvider } from '../../namespaces/namespacesOperationsProvider';
import { createNamespace } from '../../namespaces/createNamespace';
import { PineconeArgumentError } from '../../../errors';

const setupResponse = (response, isSuccess) => {
  const fakeCreateNamespace: (
    req: CreateNamespaceOperationRequest,
  ) => Promise<NamespaceDescription> = jest
    .fn()
    .mockImplementation(() =>
      isSuccess ? Promise.resolve(response) : Promise.reject(response),
    );

  const NOA = {
    createNamespace: fakeCreateNamespace,
  } as NamespaceOperationsApi;

  const NamespaceOperationsProvider = {
    provide: async () => NOA,
  } as NamespaceOperationsProvider;

  const cmd = createNamespace(NamespaceOperationsProvider);

  return { fakeCreateNamespace, NOA, NamespaceOperationsProvider, cmd };
};

describe('createNamespace', () => {
  test('should call createNamespace with correct request', async () => {
    const name = 'test-namespace';
    const schema = { fields: { testField: { filterable: true } } };

    const { cmd, fakeCreateNamespace } = setupResponse(
      {
        name,
        schema,
      },
      true,
    );

    await cmd({ name, schema });
    expect(fakeCreateNamespace).toHaveBeenCalledWith({
      createNamespaceRequest: { name, schema },
      xPineconeApiVersion: X_PINECONE_API_VERSION,
    });
  });

  test('should throw PineconeArgumentError if name is not provided', async () => {
    const { cmd } = setupResponse(undefined, false);

    await expect(cmd({ name: '' })).rejects.toThrow(PineconeArgumentError);
    await expect(cmd({ name: '' })).rejects.toThrow(
      'You must pass a non-empty string for `name` in order to create a namespace.',
    );
  });
});
