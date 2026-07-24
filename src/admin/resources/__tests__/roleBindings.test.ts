import { RoleBindingsNamespace } from '../roleBindings';
import {
  type RoleBindingsApi,
  X_PINECONE_API_VERSION,
} from '../../../pinecone-generated-ts-fetch/admin';
import { PineconeArgumentError } from '../../../errors';

const setup = () => {
  const api = {
    createRoleBinding: jest.fn().mockResolvedValue({ id: 'rb-1' }),
    fetchRoleBinding: jest.fn().mockResolvedValue({ id: 'rb-1' }),
    listRoleBindings: jest.fn().mockResolvedValue({ data: [] }),
    deleteRoleBinding: jest.fn().mockResolvedValue(undefined),
  } as unknown as RoleBindingsApi;
  return { api, roleBindings: new RoleBindingsNamespace(api) };
};

describe('RoleBindingsNamespace', () => {
  test('create passes all required fields through', async () => {
    const { api, roleBindings } = setup();
    await roleBindings.create({
      principalType: 'service_account',
      principalId: 'sa-1',
      resourceType: 'organization',
      role: 'OrgMember',
    });
    expect(api.createRoleBinding).toHaveBeenCalledWith({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      createRoleBindingRequest: {
        principalType: 'service_account',
        principalId: 'sa-1',
        resourceType: 'organization',
        resourceId: undefined,
        role: 'OrgMember',
      },
    });
  });

  test.each([
    ['principalId', { principalType: 'x', resourceType: 'y', role: 'z' }],
    ['principalType', { principalId: 'x', resourceType: 'y', role: 'z' }],
    ['resourceType', { principalId: 'x', principalType: 'y', role: 'z' }],
    ['role', { principalId: 'x', principalType: 'y', resourceType: 'z' }],
  ])('create throws when %s is missing', async (_field, options) => {
    const { roleBindings } = setup();
    await expect(roleBindings.create(options as never)).rejects.toThrow(
      PineconeArgumentError,
    );
  });

  test('list forwards filters and pagination', async () => {
    const { api, roleBindings } = setup();
    await roleBindings.list({
      principalType: 'service_account',
      principalId: 'sa-1',
      limit: 10,
      paginationToken: 'tok',
    });
    expect(api.listRoleBindings).toHaveBeenCalledWith({
      xPineconeApiVersion: X_PINECONE_API_VERSION,
      principalType: 'service_account',
      principalId: 'sa-1',
      resourceType: undefined,
      resourceId: undefined,
      role: undefined,
      limit: 10,
      paginationToken: 'tok',
    });
  });

  test('list works with no arguments', async () => {
    const { api, roleBindings } = setup();
    await roleBindings.list();
    expect(api.listRoleBindings).toHaveBeenCalled();
  });

  test('delete throws when roleBindingId is empty', async () => {
    const { roleBindings } = setup();
    await expect(roleBindings.delete('')).rejects.toThrow(
      PineconeArgumentError,
    );
  });
});
