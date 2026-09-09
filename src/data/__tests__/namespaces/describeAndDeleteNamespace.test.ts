import { describeNamespace } from '../../namespaces/describeNamespace';
import { deleteNamespace } from '../../namespaces/deleteNamespace';
import { NamespaceOperationsProvider } from '../../namespaces/namespacesOperationsProvider';

const namespace = 'tenant / special';

describe.each([
  {
    name: 'describeNamespace',
    command: describeNamespace,
    response: { name: namespace, recordCount: '2' },
  },
  { name: 'deleteNamespace', command: deleteNamespace, response: undefined },
])('$name', ({ name, command, response }) => {
  test('forwards the namespace and API version and preserves the result', async () => {
    const operation = jest.fn().mockResolvedValue(response);
    const provide = jest.fn().mockResolvedValue({ [name]: operation });
    const provider = { provide } as unknown as NamespaceOperationsProvider;
    await expect(command(provider)(namespace)).resolves.toEqual(response);
    expect(provide).toHaveBeenCalledTimes(1);
    expect(operation).toHaveBeenCalledTimes(1);
    expect(operation).toHaveBeenCalledWith({
      namespace,
      xPineconeApiVersion: '2026-07',
    });
  });

  test('propagates operation failures', async () => {
    const error = new Error('namespace request failed');
    const operation = jest.fn().mockRejectedValue(error);
    const provider = {
      provide: jest.fn().mockResolvedValue({ [name]: operation }),
    } as unknown as NamespaceOperationsProvider;
    await expect(command(provider)(namespace)).rejects.toBe(error);
  });

  test('propagates provider failures before attempting a request', async () => {
    const error = new Error('host lookup failed');
    const provider = {
      provide: jest.fn().mockRejectedValue(error),
    } as unknown as NamespaceOperationsProvider;
    await expect(command(provider)(namespace)).rejects.toBe(error);
  });
});
