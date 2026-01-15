import { buildUserAgent } from '../user-agent';
import * as EnvironmentModule from '../environment';
import type { PineconeConfiguration } from '../../data';

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

    test('applies caller when provided via PineconeConfiguration with provider and model', () => {
      const config = {
        apiKey: 'test-api-key',
        caller: {
          provider: 'google',
          model: 'gemini',
        },
      };

      const userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller=google:gemini');
    });

    test('applies caller when provided via PineconeConfiguration with only model', () => {
      const config = {
        apiKey: 'test-api-key',
        caller: {
          model: 'claude-code',
        },
      };

      const userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller=claude-code');
    });

    test('does not include caller when not provided via PineconeConfiguration', () => {
      const config = {
        apiKey: 'test-api-key',
      };

      const userAgent = buildUserAgent(config);
      expect(userAgent).not.toContain('caller=');
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

  describe('caller formatting', () => {
    test('normalizes caller strings with special characters', () => {
      let config: PineconeConfiguration = {
        apiKey: 'test-api-key',
        caller: {
          provider: 'Google',
          model: 'Gemini 2.5',
        },
      };
      let userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller=google:gemini_2.5');

      config = {
        apiKey: 'test-api-key',
        caller: {
          provider: '  My   Provider  ',
          model: 'Model-Name!!!',
        },
      };
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller=my_provider:model-name');

      config = {
        apiKey: 'test-api-key',
        caller: {
          model: 'Claude Code Version',
        },
      };
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller=claude_code_version');
    });

    test('handles caller with provider containing colons and hyphens', () => {
      const config = {
        apiKey: 'test-api-key',
        caller: {
          provider: 'provider-name',
          model: 'model-name',
        },
      };
      const userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller=provider-name:model-name');
    });

    test('handles empty or invalid caller values gracefully', () => {
      let config: PineconeConfiguration = {
        apiKey: 'test-api-key',
        caller: {
          provider: '',
          model: 'valid-model',
        },
      };
      let userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller=valid-model');

      config = {
        apiKey: 'test-api-key',
        caller: {
          model: '',
        },
      };
      userAgent = buildUserAgent(config);
      expect(userAgent).not.toContain('caller=');

      config = {
        apiKey: 'test-api-key',
        caller: {
          provider: '   ',
          model: 'valid-model',
        },
      };
      userAgent = buildUserAgent(config);
      expect(userAgent).toContain('caller=valid-model');

      config = {
        apiKey: 'test-api-key',
        caller: {
          provider: 'valid-provider',
          model: '!!!',
        },
      };
      userAgent = buildUserAgent(config);
      expect(userAgent).not.toContain('caller=');

      config = {
        apiKey: 'test-api-key',
        caller: {
          model: '   ',
        },
      };
      userAgent = buildUserAgent(config);
      expect(userAgent).not.toContain('caller=');

      config = {
        apiKey: 'test-api-key',
        caller: {
          provider: 'valid-provider',
          model: '   ',
        },
      };
      userAgent = buildUserAgent(config);
      expect(userAgent).not.toContain('caller=');
    });
  });
});
