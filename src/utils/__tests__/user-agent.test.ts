import { buildUserAgent } from '../user-agent';
import * as EnvironmentModule from '../environment';

describe('buildUserAgent', () => {
  test('applies Edge Runtime when running in an edge environment', () => {
    jest.spyOn(EnvironmentModule, 'isEdge').mockReturnValue(true);
    const config = { apiKey: 'test-api-key' };
    const userAgent = buildUserAgent(config);

    expect(userAgent).toContain('Edge Runtime');
  });

  test('applies integrationId when provided via PineconeConfiguration', () => {
    const config = {
      apiKey: 'test-api-key',
      integrationId: 'test-integration-id',
    };

    const userAgent = buildUserAgent(config);
    expect(userAgent).toContain('integrationId=test-integration-id');
  });
});
