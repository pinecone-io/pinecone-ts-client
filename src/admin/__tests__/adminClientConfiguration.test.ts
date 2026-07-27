import { resolveAdminClientConfiguration } from '../adminClientConfiguration';
import { PineconeConfigurationError } from '../../errors';

describe('resolveAdminClientConfiguration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.PINECONE_CLIENT_ID;
    delete process.env.PINECONE_CLIENT_SECRET;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('uses explicitly-passed clientId and clientSecret', () => {
    const resolved = resolveAdminClientConfiguration({
      clientId: 'explicit-id',
      clientSecret: 'explicit-secret',
    });
    expect(resolved.clientId).toBe('explicit-id');
    expect(resolved.clientSecret).toBe('explicit-secret');
  });

  test('falls back to environment variables when not passed', () => {
    process.env.PINECONE_CLIENT_ID = 'env-id';
    process.env.PINECONE_CLIENT_SECRET = 'env-secret';
    const resolved = resolveAdminClientConfiguration();
    expect(resolved.clientId).toBe('env-id');
    expect(resolved.clientSecret).toBe('env-secret');
  });

  test('explicit values take precedence over environment variables', () => {
    process.env.PINECONE_CLIENT_ID = 'env-id';
    process.env.PINECONE_CLIENT_SECRET = 'env-secret';
    const resolved = resolveAdminClientConfiguration({
      clientId: 'explicit-id',
      clientSecret: 'explicit-secret',
    });
    expect(resolved.clientId).toBe('explicit-id');
    expect(resolved.clientSecret).toBe('explicit-secret');
  });

  test('throws when clientId cannot be resolved', () => {
    process.env.PINECONE_CLIENT_SECRET = 'env-secret';
    expect(() => resolveAdminClientConfiguration()).toThrow(
      PineconeConfigurationError,
    );
    expect(() => resolveAdminClientConfiguration()).toThrow(/clientId/);
  });

  test('throws when clientSecret cannot be resolved', () => {
    expect(() =>
      resolveAdminClientConfiguration({ clientId: 'only-id' }),
    ).toThrow(/clientSecret/);
  });
});
