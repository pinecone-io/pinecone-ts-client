import { buildUserAgent } from '../user-agent';
import * as EnvironmentModule from '../environment';

describe('user-agent', () => {
  describe('buildUserAgent', () => {
    test('applies Edge Runtime when running in an edge environment', () => {
      jest.spyOn(EnvironmentModule, 'isEdge').mockReturnValue(true);
      const config = { apiKey: 'test-api-key' };
      const userAgent = buildUserAgent(config);

      expect(userAgent).toContain('Edge Runtime');
    });

    test('applies source_tag when provided via PineconeConfiguration', () => {
      const config = {
        apiKey: 'test-api-key',
        sourceTag: 'test source tag',
      };

      const userAgent = buildUserAgent(config);
      expect(userAgent).toContain('source_tag=test_source_tag');
    });
  });

  describe('normalizeSourceTag', () => {
    test('normalizes variations of sourceTag', () => {
      const config = {
        apiKey: 'test-api-key',
        sourceTag: 'my source tag!!!',
      };
      let userAgent = buildUserAgent(config);
      expect(userAgent).toContain('source_tag=my_source_tag');

      config.sourceTag = 'My Source Tag';
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('source_tag=my_source_tag');

      config.sourceTag = '   My   Source    Tag       123    ';
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('source_tag=my_source_tag_123');

      config.sourceTag = '  MY SOURCE TAG     1234     ##### !!!!!!';
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('source_tag=my_source_tag_1234');

      config.sourceTag = ' MY SOURCE TAG :1234-ABCD';
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('source_tag=my_source_tag_:1234abcd');
    });
  });
});
